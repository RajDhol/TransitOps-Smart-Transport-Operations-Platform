"""TransitOps authentication API."""

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", ROOT_DIR / "transitops.db"))
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-development-secret")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRES_HOURS = 8
DEVELOPMENT_PASSWORD = "securepassword123"

app = FastAPI(title="TransitOps API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type", "Authorization"],
)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str


class LoginResponse(BaseModel):
    token: str
    user: UserResponse


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
        database.executescript((ROOT_DIR / "schema.sql").read_text(encoding="utf-8"))
        database.executescript((ROOT_DIR / "seed_data.sql").read_text(encoding="utf-8"))

        # The supplied seed hashes are placeholders. Set a known development password
        # so the seeded accounts can be exercised locally.
        password_hash = bcrypt.hashpw(DEVELOPMENT_PASSWORD.encode(), bcrypt.gensalt()).decode()
        database.execute("UPDATE users SET password_hash = ?", (password_hash,))
        database.execute(
            """INSERT OR IGNORE INTO users (id, email, password_hash, role_id, name)
               VALUES (21, ?, ?, 1, 'Fleet Manager User')""",
            ("manager@transitops.com", password_hash),
        )


@app.on_event("startup")
def startup() -> None:
    initialize_database()


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

    response_user = UserResponse(id=user["id"], name=user["name"], email=user["email"], role=user["role"])
    expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRES_HOURS)
    token = jwt.encode(
        {"sub": str(response_user.id), "email": response_user.email, "role": response_user.role, "exp": expires_at},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    return LoginResponse(token=token, user=response_user)
