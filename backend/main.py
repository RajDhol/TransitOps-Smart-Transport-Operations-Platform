"""TransitOps backend API (Authentication & Dashboard)."""

import os
import sqlite3
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import bcrypt
import jwt
from fastapi import FastAPI, HTTPException, status, Query
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

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
        # 1. Build and execute query for vehicles
        vehicle_conditions = ["status != 'Retired'"]
        vehicle_params = []
        if type and type.strip():
            vehicle_conditions.append("lower(type) = lower(?)")
            vehicle_params.append(type.strip())

        v_where = " WHERE " + " AND ".join(vehicle_conditions)
        v_rows = database.execute(
            f"SELECT status, count(*) AS cnt FROM vehicles{v_where} GROUP BY status",
            vehicle_params,
        ).fetchall()
        v_counts = {row["status"]: row["cnt"] for row in v_rows}

        total_vehicles = sum(v_counts.values())
        active_vehicles = v_counts.get("On Trip", 0)
        available_vehicles = v_counts.get("Available", 0)
        vehicles_in_shop = v_counts.get("In Shop", 0)

        # 2. Build and execute query for trips
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
            f"SELECT status, count(*) AS cnt FROM trips{t_where} GROUP BY status",
            trip_params,
        ).fetchall()
        t_counts = {row["status"]: row["cnt"] for row in t_rows}

        active_trips = t_counts.get("Dispatched", 0)
        pending_trips = t_counts.get("Draft", 0)

        # 3. Build and execute query for drivers
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
            f"SELECT status, count(*) AS cnt FROM drivers{d_where} GROUP BY status",
            driver_params,
        ).fetchall()
        d_counts = {row["status"]: row["cnt"] for row in d_rows}

        total_drivers = sum(d_counts.values())
        drivers_on_duty = d_counts.get("On Trip", 0)
        available_drivers = d_counts.get("Available", 0)

        # 4. Calculate fleet utilization percentage
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
