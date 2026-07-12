-- ============================================================================
-- TransitOps Complete Database Schema
-- Compatible with SQLite & PostgreSQL
-- ============================================================================

-- Enable Foreign Key enforcement (required for SQLite)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. ROLES TABLE (RBAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Seed Default RBAC Roles
INSERT OR IGNORE INTO roles (id, name, description) VALUES 
(1, 'Fleet Manager', 'Manage vehicles, driver registry, and maintenance logs. Full CRUD access.'),
(2, 'Driver / Dispatcher', 'Manage trips, update trip status, record final odometer readings, and log trip expenses.'),
(3, 'Safety Officer', 'Ensure compliance, track driver licenses, safety scores, and suspend/reactivate drivers.'),
(4, 'Financial Analyst', 'Access reports and analytics dashboards, monitor fuel logs, expenses, and vehicle ROI.');

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- ============================================================================
-- 3. VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    registration_number VARCHAR(50) PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    max_load_capacity NUMERIC(10, 2) NOT NULL CHECK (max_load_capacity > 0),
    odometer NUMERIC(10, 2) NOT NULL CHECK (odometer >= 0),
    acquisition_cost NUMERIC(12, 2) NOT NULL CHECK (acquisition_cost >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Available' 
        CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired'))
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);

-- ============================================================================
-- 4. DRIVERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    license_category VARCHAR(20) NOT NULL,
    license_expiry_date DATE NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    safety_score INTEGER NOT NULL DEFAULT 100 CHECK (safety_score BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'Available' 
        CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended'))
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_number ON drivers(license_number);

-- ============================================================================
-- 5. TRIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle_reg VARCHAR(50) NOT NULL,
    driver_id INTEGER NOT NULL,
    cargo_weight NUMERIC(10, 2) NOT NULL CHECK (cargo_weight > 0),
    planned_distance NUMERIC(10, 2) NOT NULL CHECK (planned_distance > 0),
    final_odometer NUMERIC(10, 2) NULL CHECK (final_odometer IS NULL OR final_odometer >= 0),
    fuel_consumed NUMERIC(10, 2) NULL CHECK (fuel_consumed IS NULL OR fuel_consumed >= 0),
    revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' 
        CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_reg) REFERENCES vehicles(registration_number) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_trips_vehicle_reg ON trips(vehicle_reg);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- ============================================================================
-- 6. MAINTENANCE LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_reg VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL CHECK (cost >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' 
        CHECK (status IN ('Active', 'Completed')),
    FOREIGN KEY (vehicle_reg) REFERENCES vehicles(registration_number) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_reg ON maintenance_logs(vehicle_reg);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_logs(status);

-- ============================================================================
-- 7. FUEL LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_reg VARCHAR(50) NOT NULL,
    liters NUMERIC(10, 2) NOT NULL CHECK (liters > 0),
    cost NUMERIC(12, 2) NOT NULL CHECK (cost > 0),
    log_date DATE NOT NULL,
    FOREIGN KEY (vehicle_reg) REFERENCES vehicles(registration_number) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fuel_vehicle_reg ON fuel_logs(vehicle_reg);

-- ============================================================================
-- 8. EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_reg VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Toll, Insurance, Permit, Fine, Other
    cost NUMERIC(12, 2) NOT NULL CHECK (cost > 0),
    expense_date DATE NOT NULL,
    notes TEXT NULL,
    FOREIGN KEY (vehicle_reg) REFERENCES vehicles(registration_number) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_reg ON expenses(vehicle_reg);
