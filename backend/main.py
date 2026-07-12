"""TransitOps backend API (Authentication, Dashboard, and Vehicles)."""

import os
import sqlite3
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timedelta, timezone
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


def format_num(val: float) -> str:
    return f"{int(val)}" if val == int(val) else f"{val}"


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
            detail=f"This account belongs to the '{database_role}' role. Please choose your correct role.",
        )

    response_user = UserResponse(id=user["id"], name=user["name"], email=user["email"], role=user["role"])
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
    """Create a draft trip after validating vehicle and driver capacity."""
    if trip.cargo_weight <= 0 or trip.planned_distance <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Weight and distance must be positive")

    with connection() as database:
        vehicle = database.execute(
            "SELECT registration_number, max_load_capacity, status FROM vehicles WHERE registration_number = ?",
            (trip.vehicle_reg.strip(),),
        ).fetchone()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

        driver = database.execute("SELECT id, status FROM drivers WHERE id = ?", (trip.driver_id,)).fetchone()
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

        if trip.cargo_weight > vehicle["max_load_capacity"]:
            w_str = format_num(trip.cargo_weight)
            cap_str = format_num(vehicle["max_load_capacity"])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cargo weight ({w_str}kg) exceeds vehicle load capacity ({cap_str}kg)",
            )

        cursor = database.execute(
            """INSERT INTO trips
               (source, destination, vehicle_reg, driver_id, cargo_weight, planned_distance, status)
               VALUES (?, ?, ?, ?, ?, ?, 'Draft')""",
            (
                trip.source.strip(),
                trip.destination.strip(),
                trip.vehicle_reg.strip(),
                trip.driver_id,
                trip.cargo_weight,
                trip.planned_distance,
            ),
        )
        trip_id = cursor.lastrowid

    return TripCreateResponse(trip_id=trip_id, status="Draft")


@app.post("/api/trips/{id}/dispatch", response_model=TripStatusUpdateResponse)
def dispatch_trip(id: int) -> TripStatusUpdateResponse:
    """Dispatch a drafted trip and automatically switch vehicle and driver status to On Trip."""
    with connection() as database:
        trip = database.execute(
            "SELECT id, vehicle_reg, driver_id, status FROM trips WHERE id = ?", (id,)
        ).fetchone()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        if trip["status"] != "Draft":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Draft trips can be dispatched")

        driver = database.execute(
            "SELECT id, status, license_expiry_date FROM drivers WHERE id = ?", (trip["driver_id"],)
        ).fetchone()
        if not driver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")

        is_expired = False
        try:
            exp_date = datetime.strptime(driver["license_expiry_date"], "%Y-%m-%d").date()
            if exp_date < datetime.now(timezone.utc).date():
                is_expired = True
        except Exception:
            pass

        if driver["status"] == "Suspended" or is_expired:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Driver is currently Suspended or has an expired license.",
            )

        vehicle = database.execute(
            "SELECT registration_number, status FROM vehicles WHERE registration_number = ?",
            (trip["vehicle_reg"],),
        ).fetchone()
        if not vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

        database.execute("UPDATE trips SET status = 'Dispatched' WHERE id = ?", (id,))
        database.execute("UPDATE vehicles SET status = 'On Trip' WHERE registration_number = ?", (trip["vehicle_reg"],))
        database.execute("UPDATE drivers SET status = 'On Trip' WHERE id = ?", (trip["driver_id"],))

    return TripStatusUpdateResponse(
        trip_id=id,
        status="Dispatched",
        vehicle_status="On Trip",
        driver_status="On Trip",
    )


@app.post("/api/trips/{id}/complete", response_model=TripStatusUpdateResponse)
def complete_trip(id: int, request: TripCompleteRequest) -> TripStatusUpdateResponse:
    """Complete an active trip by logging final mileage, fuel, and restoring vehicle and driver to Available."""
    with connection() as database:
        trip = database.execute(
            "SELECT id, vehicle_reg, driver_id, status FROM trips WHERE id = ?", (id,)
        ).fetchone()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        if trip["status"] != "Dispatched":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Dispatched trips can be completed")

        database.execute(
            """UPDATE trips
               SET final_odometer = ?, fuel_consumed = ?, revenue = ?, status = 'Completed'
               WHERE id = ?""",
            (request.final_odometer, request.fuel_consumed_liters, request.revenue, id),
        )
        database.execute(
            "UPDATE vehicles SET odometer = ?, status = 'Available' WHERE registration_number = ?",
            (request.final_odometer, trip["vehicle_reg"]),
        )
        database.execute("UPDATE drivers SET status = 'Available' WHERE id = ?", (trip["driver_id"],))

    return TripStatusUpdateResponse(
        trip_id=id,
        status="Completed",
        vehicle_status="Available",
        driver_status="Available",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
