"""TransitOps backend API (Authentication, Dashboard, and Vehicles)."""

import os
import sqlite3
from contextlib import asynccontextmanager, contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import bcrypt
import jwt
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BACKEND_DIR = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", BACKEND_DIR / "transitops.db"))
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-development-secret")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRES_HOURS = 8


@contextmanager
def connection():
    database = sqlite3.connect(DATABASE_PATH)
    database.row_factory = sqlite3.Row
    database.execute("PRAGMA foreign_keys = ON")
    try:
        yield database
        database.commit()
    finally:
        database.close()


def initialize_database() -> None:
    """Create and populate the local SQLite database from the supplied SQL files."""
    with connection() as database:
        schema_path = BACKEND_DIR / "schema.sql"
        seed_path = BACKEND_DIR / "seed_data.sql"
        if schema_path.exists():
            database.executescript(schema_path.read_text(encoding="utf-8"))
        if seed_path.exists():
            database.executescript(seed_path.read_text(encoding="utf-8"))
        
        # Override seed hashes with the known development password
        dev_password = "securepassword123"
        password_hash = bcrypt.hashpw(dev_password.encode(), bcrypt.gensalt()).decode()
        database.execute("UPDATE users SET password_hash = ?", (password_hash,))


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="TransitOps API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: str
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str


class LoginResponse(BaseModel):
    token: str
    user: UserResponse


class DashboardResponse(BaseModel):
    total_vehicles: int
    active_vehicles: int
    available_vehicles: int
    vehicles_in_shop: int
    active_trips: int
    pending_trips: int
    total_drivers: int
    drivers_on_duty: int
    available_drivers: int
    fleet_utilization_percentage: float


class VehicleCreate(BaseModel):
    registration_number: str
    model: str
    type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float


class VehicleResponse(VehicleCreate):
    status: str


class VehicleRegistrationResponse(BaseModel):
    registration_number: str
    status: str
    message: str


class TripCreateRequest(BaseModel):
    source: str
    destination: str
    vehicle_reg: str
    driver_id: int
    cargo_weight: float
    planned_distance: float


class TripCreateResponse(BaseModel):
    trip_id: int
    status: str


class TripStatusUpdateResponse(BaseModel):
    trip_id: int
    status: str
    vehicle_status: str
    driver_status: str


class TripCompleteRequest(BaseModel):
    final_odometer: float
    fuel_consumed_liters: float
    revenue: float


class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry_date: date
    contact_number: str
    safety_score: int = 100


class DriverResponse(DriverCreate):
    id: int
    status: str


class DriverRegistrationResponse(BaseModel):
    id: int
    name: str
    status: str


class SafetyEventCreate(BaseModel):
    event_type: str
    points: int
    notes: str | None = None
    event_date: date | None = None


class SafetyEventResponse(BaseModel):
    id: int
    driver_id: int
    event_type: str
    points: int
    safety_score: int
    event_date: date


class MaintenanceCreate(BaseModel):
    vehicle_reg: str
    service_date: date
    description: str
    cost: float


class MaintenanceCreateResponse(BaseModel):
    maintenance_id: int
    vehicle_status: str


class MaintenanceCompleteResponse(BaseModel):
    maintenance_id: int
    status: str
    vehicle_status: str


class AnalyticsResponse(BaseModel):
    total_operational_cost: float
    total_maintenance_cost: float
    total_fuel_cost: float
    fuel_efficiency_km_per_liter: float
    vehicle_roi: dict[str, float]


def format_num(value: float) -> str:
    return f"{int(value)}" if value == int(value) else f"{value}"


@app.post("/api/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest) -> LoginResponse:
    """Authenticate a user and issue an eight-hour JWT bearer token."""
    with connection() as database:
        user = database.execute(
            """SELECT users.id, users.name, users.email, users.password_hash, roles.name AS role
               FROM users
               JOIN roles ON roles.id = users.role_id
               WHERE lower(users.email) = lower(?)""",
            (credentials.email.strip(),),
        ).fetchone()

    if user is None or not bcrypt.checkpw(credentials.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    database_role = "Driver" if user["role"] == "Driver / Dispatcher" else user["role"]
    if database_role != credentials.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. The selected role is not authorized for this account.",
        )

    response_user = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=database_role,
    )
    expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRES_HOURS)
    token = jwt.encode(
        {"sub": str(response_user.id), "email": response_user.email, "role": response_user.role, "exp": expires_at},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    return LoginResponse(token=token, user=response_user)


@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(
    type: Optional[str] = Query(None, description="Filter by vehicle type (e.g. truck, van)"),
    region: Optional[str] = Query(None, description="Filter by region (matches trip source or destination)"),
) -> DashboardResponse:
    """Fetch real-time counts, indicators, and fleet utilization percentage."""
    if hasattr(type, "default"):
        type = None
    if hasattr(region, "default"):
        region = None

    with connection() as database:
        vehicle_conditions = ["status != 'Retired'"]
        vehicle_params = []
        if type and type.strip():
            vehicle_conditions.append("lower(type) = lower(?)")
            vehicle_params.append(type.strip())

        v_where = " WHERE " + " AND ".join(vehicle_conditions)
        v_rows = database.execute(
            f"SELECT status, count(*) AS cnt FROM vehicles{v_where} GROUP BY status", vehicle_params
        ).fetchall()
        v_counts = {row["status"]: row["cnt"] for row in v_rows}
        total_vehicles = sum(v_counts.values())
        active_vehicles = v_counts.get("On Trip", 0)
        available_vehicles = v_counts.get("Available", 0)
        vehicles_in_shop = v_counts.get("In Shop", 0)

        trip_conditions = []
        trip_params = []
        if type and type.strip():
            trip_conditions.append(
                "vehicle_reg IN (SELECT registration_number FROM vehicles WHERE lower(type) = lower(?))"
            )
            trip_params.append(type.strip())
        if region and region.strip():
            trip_conditions.append(
                "(lower(source) LIKE '%' || lower(?) || '%' OR lower(destination) LIKE '%' || lower(?) || '%')"
            )
            trip_params.extend([region.strip(), region.strip()])

        t_where = (" WHERE " + " AND ".join(trip_conditions)) if trip_conditions else ""
        t_rows = database.execute(
            f"SELECT status, count(*) AS cnt FROM trips{t_where} GROUP BY status", trip_params
        ).fetchall()
        t_counts = {row["status"]: row["cnt"] for row in t_rows}
        active_trips = t_counts.get("Dispatched", 0)
        pending_trips = t_counts.get("Draft", 0)

        driver_conditions = ["status != 'Suspended'"]
        driver_params = []
        if region and region.strip():
            driver_conditions.append(
                """id IN (
                    SELECT driver_id FROM trips
                    WHERE lower(source) LIKE '%' || lower(?) || '%' OR lower(destination) LIKE '%' || lower(?) || '%'
                )"""
            )
            driver_params.extend([region.strip(), region.strip()])

        d_where = " WHERE " + " AND ".join(driver_conditions)
        d_rows = database.execute(
            f"SELECT status, count(*) AS cnt FROM drivers{d_where} GROUP BY status", driver_params
        ).fetchall()
        d_counts = {row["status"]: row["cnt"] for row in d_rows}
        total_drivers = sum(d_counts.values())
        drivers_on_duty = d_counts.get("On Trip", 0)
        available_drivers = d_counts.get("Available", 0)

    utilization = round((active_vehicles / total_vehicles) * 100.0, 1) if total_vehicles > 0 else 0.0
    return DashboardResponse(
        total_vehicles=total_vehicles,
        active_vehicles=active_vehicles,
        available_vehicles=available_vehicles,
        vehicles_in_shop=vehicles_in_shop,
        active_trips=active_trips,
        pending_trips=pending_trips,
        total_drivers=total_drivers,
        drivers_on_duty=drivers_on_duty,
        available_drivers=available_drivers,
        fleet_utilization_percentage=utilization,
    )


@app.get("/api/vehicles", response_model=list[VehicleResponse])
def list_vehicles(
    status_filter: str | None = Query(default=None, alias="status"),
    vehicle_type: str | None = Query(default=None, alias="type"),
) -> list[dict]:
    """List fleet vehicles, optionally filtered by status and type."""
    query = """SELECT registration_number, model, type, max_load_capacity, odometer,
                      acquisition_cost, status FROM vehicles"""
    filters: list[str] = []
    values: list[str] = []
    if status_filter:
        filters.append("status = ?")
        values.append(status_filter)
    if vehicle_type:
        filters.append("type = ?")
        values.append(vehicle_type)
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " ORDER BY registration_number"

    with connection() as database:
        rows = database.execute(query, values).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/vehicles", response_model=VehicleRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_vehicle(vehicle: VehicleCreate) -> VehicleRegistrationResponse:
    """Register a vehicle with the default Available status."""
    if vehicle.max_load_capacity <= 0 or vehicle.odometer < 0 or vehicle.acquisition_cost < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Vehicle values are invalid")

    registration_number = vehicle.registration_number.strip()
    with connection() as database:
        existing_vehicle = database.execute(
            "SELECT 1 FROM vehicles WHERE registration_number = ?", (registration_number,)
        ).fetchone()
        if existing_vehicle:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle registration number must be unique",
            )
        database.execute(
            """INSERT INTO vehicles
               (registration_number, model, type, max_load_capacity, odometer, acquisition_cost, status)
               VALUES (?, ?, ?, ?, ?, ?, 'Available')""",
            (
                registration_number,
                vehicle.model.strip(),
                vehicle.type.strip(),
                vehicle.max_load_capacity,
                vehicle.odometer,
                vehicle.acquisition_cost,
            ),
        )

    return VehicleRegistrationResponse(
        registration_number=registration_number,
        status="Available",
        message="Vehicle registered successfully",
    )


@app.post("/api/trips", response_model=TripCreateResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip: TripCreateRequest) -> TripCreateResponse:
    """Create a draft trip after validating vehicle load capacity."""
    if trip.cargo_weight <= 0 or trip.planned_distance <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Weight and distance must be positive")

    with connection() as database:
        vehicle = database.execute(
            "SELECT registration_number, max_load_capacity FROM vehicles WHERE registration_number = ?",
            (trip.vehicle_reg.strip(),),
        ).fetchone()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        if not database.execute("SELECT 1 FROM drivers WHERE id = ?", (trip.driver_id,)).fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        if trip.cargo_weight > vehicle["max_load_capacity"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Cargo weight ({format_num(trip.cargo_weight)}kg) exceeds vehicle load capacity "
                        f"({format_num(vehicle['max_load_capacity'])}kg)"),
            )
        cursor = database.execute(
            """INSERT INTO trips (source, destination, vehicle_reg, driver_id, cargo_weight, planned_distance, status)
               VALUES (?, ?, ?, ?, ?, ?, 'Draft')""",
            (trip.source.strip(), trip.destination.strip(), trip.vehicle_reg.strip(), trip.driver_id,
             trip.cargo_weight, trip.planned_distance),
        )
    return TripCreateResponse(trip_id=cursor.lastrowid, status="Draft")


@app.post("/api/trips/{trip_id}/dispatch", response_model=TripStatusUpdateResponse)
def dispatch_trip(trip_id: int) -> TripStatusUpdateResponse:
    """Dispatch a draft trip and switch its vehicle and driver to On Trip."""
    with connection() as database:
        trip = database.execute("SELECT id, vehicle_reg, driver_id, status FROM trips WHERE id = ?", (trip_id,)).fetchone()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        if trip["status"] != "Draft":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Draft trips can be dispatched")

        driver = database.execute(
            "SELECT status, license_expiry_date FROM drivers WHERE id = ?", (trip["driver_id"],)
        ).fetchone()
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        try:
            license_expired = date.fromisoformat(driver["license_expiry_date"]) < datetime.now(timezone.utc).date()
        except ValueError:
            license_expired = True
        if driver["status"] == "Suspended" or license_expired:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Driver is currently Suspended or has an expired license.",
            )

        if not database.execute(
            "SELECT 1 FROM vehicles WHERE registration_number = ?", (trip["vehicle_reg"],)
        ).fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        database.execute("UPDATE trips SET status = 'Dispatched' WHERE id = ?", (trip_id,))
        database.execute("UPDATE vehicles SET status = 'On Trip' WHERE registration_number = ?", (trip["vehicle_reg"],))
        database.execute("UPDATE drivers SET status = 'On Trip' WHERE id = ?", (trip["driver_id"],))

    return TripStatusUpdateResponse(trip_id=trip_id, status="Dispatched", vehicle_status="On Trip", driver_status="On Trip")


@app.post("/api/trips/{trip_id}/complete", response_model=TripStatusUpdateResponse)
def complete_trip(trip_id: int, request: TripCompleteRequest) -> TripStatusUpdateResponse:
    """Complete a dispatched trip and restore its vehicle and driver to Available."""
    with connection() as database:
        trip = database.execute("SELECT vehicle_reg, driver_id, status FROM trips WHERE id = ?", (trip_id,)).fetchone()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        if trip["status"] != "Dispatched":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Dispatched trips can be completed")
        database.execute(
            """UPDATE trips SET final_odometer = ?, fuel_consumed = ?, revenue = ?, status = 'Completed' WHERE id = ?""",
            (request.final_odometer, request.fuel_consumed_liters, request.revenue, trip_id),
        )
        database.execute(
            "UPDATE vehicles SET odometer = ?, status = 'Available' WHERE registration_number = ?",
            (request.final_odometer, trip["vehicle_reg"]),
        )
        database.execute("UPDATE drivers SET status = 'Available' WHERE id = ?", (trip["driver_id"],))
    return TripStatusUpdateResponse(trip_id=trip_id, status="Completed", vehicle_status="Available", driver_status="Available")


@app.get("/api/drivers", response_model=list[DriverResponse])
def list_drivers() -> list[dict]:
    """List all driver profiles."""
    with connection() as database:
        rows = database.execute(
            """SELECT id, name, license_number, license_category, license_expiry_date,
                      contact_number, safety_score, status FROM drivers ORDER BY id"""
        ).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/drivers", response_model=DriverRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_driver(driver: DriverCreate) -> DriverRegistrationResponse:
    """Create a driver profile with the default Available status."""
    if not 0 <= driver.safety_score <= 100:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Safety score must be between 0 and 100")
    license_number = driver.license_number.strip()
    with connection() as database:
        if database.execute("SELECT 1 FROM drivers WHERE license_number = ?", (license_number,)).fetchone():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver license number must be unique")
        cursor = database.execute(
            """INSERT INTO drivers
               (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
               VALUES (?, ?, ?, ?, ?, ?, 'Available')""",
            (driver.name.strip(), license_number, driver.license_category.strip(), driver.license_expiry_date.isoformat(),
             driver.contact_number.strip(), driver.safety_score),
        )
    return DriverRegistrationResponse(id=cursor.lastrowid, name=driver.name.strip(), status="Available")


@app.post("/api/drivers/{driver_id}/safety-events", response_model=SafetyEventResponse, status_code=status.HTTP_201_CREATED)
def record_safety_event(driver_id: int, event: SafetyEventCreate) -> SafetyEventResponse:
    """Record a safety event and update the driver's score, bounded from 0 to 100."""
    if not -100 <= event.points <= 100 or event.points == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Safety event points must be between -100 and 100 and cannot be zero",
        )

    with connection() as database:
        driver = database.execute("SELECT safety_score FROM drivers WHERE id = ?", (driver_id,)).fetchone()
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
        safety_score = max(0, min(100, int(driver["safety_score"]) + event.points))
        event_date = event.event_date or date.today()
        cursor = database.execute(
            """INSERT INTO driver_safety_events (driver_id, event_type, points, notes, event_date)
               VALUES (?, ?, ?, ?, ?)""",
            (driver_id, event.event_type.strip(), event.points, event.notes, event_date.isoformat()),
        )
        database.execute("UPDATE drivers SET safety_score = ? WHERE id = ?", (safety_score, driver_id))

    return SafetyEventResponse(
        id=cursor.lastrowid,
        driver_id=driver_id,
        event_type=event.event_type.strip(),
        points=event.points,
        safety_score=safety_score,
        event_date=event_date,
    )


@app.post("/api/maintenance", response_model=MaintenanceCreateResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_record(maintenance: MaintenanceCreate) -> MaintenanceCreateResponse:
    """Create an active maintenance record and place the vehicle in the shop."""
    if maintenance.cost < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Maintenance cost cannot be negative")

    vehicle_reg = maintenance.vehicle_reg.strip()
    with connection() as database:
        if not database.execute(
            "SELECT 1 FROM vehicles WHERE registration_number = ?", (vehicle_reg,)
        ).fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        cursor = database.execute(
            """INSERT INTO maintenance_logs (vehicle_reg, service_date, description, cost, status)
               VALUES (?, ?, ?, ?, 'Active')""",
            (vehicle_reg, maintenance.service_date.isoformat(), maintenance.description.strip(), maintenance.cost),
        )
        database.execute("UPDATE vehicles SET status = 'In Shop' WHERE registration_number = ?", (vehicle_reg,))

    return MaintenanceCreateResponse(maintenance_id=cursor.lastrowid, vehicle_status="In Shop")


@app.post("/api/maintenance/{maintenance_id}/complete", response_model=MaintenanceCompleteResponse)
def complete_maintenance_record(maintenance_id: int) -> MaintenanceCompleteResponse:
    """Complete an active maintenance record and restore vehicle availability."""
    with connection() as database:
        maintenance = database.execute(
            "SELECT id, vehicle_reg, status FROM maintenance_logs WHERE id = ?", (maintenance_id,)
        ).fetchone()
        if not maintenance:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found")
        if maintenance["status"] != "Active":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Active maintenance records can be completed")
        database.execute("UPDATE maintenance_logs SET status = 'Completed' WHERE id = ?", (maintenance_id,))
        database.execute(
            "UPDATE vehicles SET status = 'Available' WHERE registration_number = ?", (maintenance["vehicle_reg"],)
        )

    return MaintenanceCompleteResponse(
        maintenance_id=maintenance_id,
        status="Completed",
        vehicle_status="Available",
    )


@app.get("/api/reports/analytics", response_model=AnalyticsResponse)
def get_analytics() -> AnalyticsResponse:
    """Calculate fleet operating costs, fuel efficiency, and vehicle ROI."""
    with connection() as database:
        maintenance_cost = float(database.execute(
            "SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs"
        ).fetchone()[0])
        fuel_cost = float(database.execute(
            "SELECT COALESCE(SUM(cost), 0) FROM fuel_logs"
        ).fetchone()[0])
        expense_cost = float(database.execute(
            "SELECT COALESCE(SUM(cost), 0) FROM expenses"
        ).fetchone()[0])
        distance, fuel_consumed = database.execute(
            """SELECT COALESCE(SUM(planned_distance), 0), COALESCE(SUM(fuel_consumed), 0)
               FROM trips WHERE status = 'Completed' AND fuel_consumed > 0"""
        ).fetchone()
        roi_rows = database.execute(
            """SELECT v.registration_number, v.acquisition_cost,
                      COALESCE((SELECT SUM(revenue) FROM trips t WHERE t.vehicle_reg = v.registration_number), 0) AS revenue,
                      COALESCE((SELECT SUM(cost) FROM fuel_logs f WHERE f.vehicle_reg = v.registration_number), 0) AS fuel_cost,
                      COALESCE((SELECT SUM(cost) FROM maintenance_logs m WHERE m.vehicle_reg = v.registration_number), 0) AS maintenance_cost,
                      COALESCE((SELECT SUM(cost) FROM expenses e WHERE e.vehicle_reg = v.registration_number), 0) AS expense_cost
               FROM vehicles v ORDER BY v.registration_number"""
        ).fetchall()

    vehicle_roi = {
        row["registration_number"]: round(
            (float(row["revenue"]) - float(row["fuel_cost"]) - float(row["maintenance_cost"]) - float(row["expense_cost"]))
            / float(row["acquisition_cost"]),
            4,
        ) if float(row["acquisition_cost"]) > 0 else 0.0
        for row in roi_rows
    }
    return AnalyticsResponse(
        total_operational_cost=round(maintenance_cost + fuel_cost + expense_cost, 2),
        total_maintenance_cost=round(maintenance_cost, 2),
        total_fuel_cost=round(fuel_cost, 2),
        fuel_efficiency_km_per_liter=round(float(distance) / float(fuel_consumed), 2) if fuel_consumed else 0.0,
        vehicle_roi=vehicle_roi,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
