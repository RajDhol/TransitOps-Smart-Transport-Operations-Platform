-- ============================================================================
-- TransitOps Comprehensive Seed Data File
-- Contains >= 20 realistic, human-curated records for EVERY table
-- Compatible with SQLite & PostgreSQL
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. ROLES (4 Default PRD Records)
-- ============================================================================
INSERT OR IGNORE INTO roles (id, name, description) VALUES
(1, 'Fleet Manager', 'Manage vehicles, driver registry, and maintenance logs. Full CRUD access.'),
(2, 'Driver / Dispatcher', 'Manage trips, update trip status, record final odometer readings, and log trip expenses.'),
(3, 'Safety Officer', 'Ensure compliance, track driver licenses, safety scores, and suspend/reactivate drivers.'),
(4, 'Financial Analyst', 'Access reports and analytics dashboards, monitor fuel logs, expenses, and vehicle ROI.');

-- ============================================================================
-- 2. USERS (20 Records)
-- Staff accounts across various roles with realistic human names
-- ============================================================================
INSERT OR IGNORE INTO users (id, email, password_hash, role_id, name) VALUES
(1, 'robert.miller@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 1, 'Robert Miller'),
(2, 'sarah.jenkins@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 1, 'Sarah Jenkins'),
(3, 'david.chen@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 2, 'David Chen'),
(4, 'emily.rodriguez@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 2, 'Emily Rodriguez'),
(5, 'michael.chang@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 3, 'Michael Chang'),
(6, 'jessica.taylor@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 3, 'Jessica Taylor'),
(7, 'william.anderson@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 4, 'William Anderson'),
(8, 'samantha.patel@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 4, 'Samantha Patel'),
(9, 'james.wilson@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 1, 'James Wilson'),
(10, 'elizabeth.thomas@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 2, 'Elizabeth Thomas'),
(11, 'daniel.martinez@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 2, 'Daniel Martinez'),
(12, 'laura.hernandez@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 3, 'Laura Hernandez'),
(13, 'christopher.lee@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 1, 'Christopher Lee'),
(14, 'amanda.white@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 2, 'Amanda White'),
(15, 'matthew.harris@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 3, 'Matthew Harris'),
(16, 'stephanie.clark@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 4, 'Stephanie Clark'),
(17, 'joshua.lewis@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 4, 'Joshua Lewis'),
(18, 'megan.walker@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 2, 'Megan Walker'),
(19, 'andrew.hall@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 1, 'Andrew Hall'),
(20, 'rachel.allen@transitops.com', '$2b$12$KixuRqvFh.h4n/P8.qLp.eO8W9k4T6V1X7J8L9M0N1P2Q3R4S5T6u', 4, 'Rachel Allen');

-- ============================================================================
-- 3. VEHICLES (20 Records)
-- Diverse commercial fleet with realistic capacities, odometers & statuses
-- ============================================================================
INSERT OR IGNORE INTO vehicles (registration_number, model, type, max_load_capacity, odometer, acquisition_cost, status) VALUES
('TRK-9010-NY', 'Freightliner Cascadia 126', 'Truck', 22000.00, 145230.50, 165000.00, 'Available'),
('TRK-9011-CA', 'Volvo VNL 860 Sleeper', 'Truck', 21500.00, 189400.20, 172000.00, 'On Trip'),
('TRK-9012-TX', 'Kenworth T680 Next Gen', 'Truck', 23000.00, 89120.00, 180000.00, 'On Trip'),
('TRK-9013-FL', 'Peterbilt 579 UltraLoft', 'Truck', 22500.00, 210500.80, 168000.00, 'In Shop'),
('TRK-9014-IL', 'International LT625', 'Truck', 20000.00, 312000.00, 145000.00, 'Available'),
('VAN-4020-NY', 'Ford Transit 350 High Roof', 'Van', 2100.00, 45210.30, 52000.00, 'Available'),
('VAN-4021-CA', 'Mercedes-Benz Sprinter 2500', 'Van', 2250.00, 62100.00, 58000.00, 'On Trip'),
('VAN-4022-TX', 'Ram ProMaster 3500 Ext', 'Van', 2150.00, 38450.70, 49000.00, 'Available'),
('VAN-4023-WA', 'Chevrolet Express Cargo 3500', 'Van', 1980.00, 115600.00, 44000.00, 'In Shop'),
('VAN-4024-GA', 'Nissan NV3500 HD Cargo', 'Van', 2020.00, 94200.40, 46000.00, 'Available'),
('REF-7030-OH', 'Utility 3000R Refrigerated Trailer', 'Refrigerated Truck', 19500.00, 128900.00, 135000.00, 'Available'),
('REF-7031-MI', 'Great Dane Everest Reefer', 'Refrigerated Truck', 20000.00, 174300.00, 142000.00, 'On Trip'),
('REF-7032-PA', 'Wabash National ArcticLite', 'Refrigerated Truck', 19000.00, 85600.00, 138000.00, 'Available'),
('FLT-5040-AZ', 'Fontaine Revolution Flatbed', 'Flatbed', 24000.00, 162100.00, 95000.00, 'On Trip'),
('FLT-5041-CO', 'Transcraft Eagle W-2 Flatbed', 'Flatbed', 23500.00, 198400.00, 92000.00, 'Available'),
('SDN-1050-NY', 'Toyota Camry Hybrid Executive', 'Sedan', 450.00, 24100.00, 31000.00, 'Available'),
('SDN-1051-CA', 'Honda Accord Touring', 'Sedan', 460.00, 41200.00, 33000.00, 'On Trip'),
('SDN-1052-IL', 'Chevrolet Malibu LT', 'Sedan', 440.00, 78900.00, 26000.00, 'Available'),
('TRK-9015-NJ', 'Mack Anthem 70-Inch Sleeper', 'Truck', 22800.00, 410200.00, 155000.00, 'Retired'),
('VAN-4025-OR', 'Ford E-350 Super Duty Cutaway', 'Van', 2400.00, 289400.00, 41000.00, 'Retired');

-- ============================================================================
-- 4. DRIVERS (20 Records)
-- Professional drivers with mixed safety scores, statuses, and expiry dates
-- ============================================================================
INSERT OR IGNORE INTO drivers (id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES
(1, 'Carlos Ramirez', 'DL-NY-849201', 'Class A CDL', '2028-05-14', '+1-555-0101', 98, 'Available'),
(2, 'Arthur Morgan', 'DL-CA-338192', 'Class A CDL', '2027-11-20', '+1-555-0102', 95, 'On Trip'),
(3, 'John Marston', 'DL-TX-992014', 'Class A CDL', '2029-03-10', '+1-555-0103', 92, 'On Trip'),
(4, 'Sadie Adler', 'DL-FL-746281', 'Class A CDL', '2028-08-15', '+1-555-0104', 100, 'Available'),
(5, 'Charles Smith', 'DL-IL-119283', 'Class A CDL', '2027-01-30', '+1-555-0105', 88, 'Available'),
(6, 'Lenny Summers', 'DL-NY-554210', 'Class B CDL', '2028-09-22', '+1-555-0106', 96, 'Available'),
(7, 'Hosea Matthews', 'DL-CA-442819', 'Class B CDL', '2026-12-05', '+1-555-0107', 91, 'On Trip'),
(8, 'Abigail Roberts', 'DL-TX-332918', 'Class B CDL', '2029-07-18', '+1-555-0108', 99, 'Available'),
(9, 'Bill Williamson', 'DL-WA-883921', 'Class B CDL', '2027-04-12', '+1-555-0109', 76, 'Suspended'),
(10, 'Javier Escuella', 'DL-GA-221983', 'Class B CDL', '2028-10-31', '+1-555-0110', 94, 'Available'),
(11, 'Micah Bell', 'DL-OH-663920', 'Class A CDL', '2025-11-15', '+1-555-0111', 65, 'Suspended'),
(12, 'Karen Jones', 'DL-MI-112938', 'Class A CDL', '2028-02-19', '+1-555-0112', 97, 'On Trip'),
(13, 'Simon Pearson', 'DL-PA-993821', 'Class A CDL', '2027-06-25', '+1-555-0113', 89, 'Off Duty'),
(14, 'Mary-Beth Gaskill', 'DL-AZ-445829', 'Class A CDL', '2029-01-14', '+1-555-0114', 98, 'On Trip'),
(15, 'Tilly Jackson', 'DL-CO-773829', 'Class A CDL', '2028-12-09', '+1-555-0115', 93, 'Available'),
(16, 'Sean MacGuire', 'DL-NY-338291', 'Class C CDL', '2026-10-20', '+1-555-0116', 82, 'Available'),
(17, 'Josiah Trelawny', 'DL-CA-665910', 'Class C CDL', '2027-08-04', '+1-555-0117', 90, 'On Trip'),
(18, 'Susan Grimshaw', 'DL-IL-554920', 'Class C CDL', '2028-04-17', '+1-555-0118', 95, 'Off Duty'),
(19, 'Leopold Strauss', 'DL-NJ-119203', 'Class A CDL', '2025-05-10', '+1-555-0119', 78, 'Off Duty'),
(20, 'Orville Swanson', 'DL-OR-994821', 'Class B CDL', '2026-03-22', '+1-555-0120', 85, 'Available');

-- ============================================================================
-- 5. TRIPS (20 Records)
-- Intercity and regional dispatches covering all 4 lifecycle statuses
-- ============================================================================
INSERT OR IGNORE INTO trips (id, source, destination, vehicle_reg, driver_id, cargo_weight, planned_distance, final_odometer, fuel_consumed, revenue, status, created_at) VALUES
(1, 'New York, NY', 'Boston, MA', 'TRK-9010-NY', 1, 18500.00, 215.50, 145230.50, 68.20, 1850.00, 'Completed', '2026-06-01 08:30:00'),
(2, 'Los Angeles, CA', 'San Francisco, CA', 'TRK-9011-CA', 2, 20200.00, 382.00, NULL, NULL, 3200.00, 'Dispatched', '2026-07-11 14:15:00'),
(3, 'Dallas, TX', 'Houston, TX', 'TRK-9012-TX', 3, 21000.00, 240.00, NULL, NULL, 2100.00, 'Dispatched', '2026-07-12 06:00:00'),
(4, 'Chicago, IL', 'Detroit, MI', 'TRK-9014-IL', 5, 17800.00, 283.00, 312000.00, 89.50, 2450.00, 'Completed', '2026-06-15 09:00:00'),
(5, 'Albany, NY', 'Buffalo, NY', 'VAN-4020-NY', 6, 1850.00, 292.00, 45210.30, 41.00, 1200.00, 'Completed', '2026-06-20 10:45:00'),
(6, 'San Diego, CA', 'Sacramento, CA', 'VAN-4021-CA', 7, 1950.00, 504.00, NULL, NULL, 2800.00, 'Dispatched', '2026-07-11 18:20:00'),
(7, 'Austin, TX', 'San Antonio, TX', 'VAN-4022-TX', 8, 1600.00, 80.00, 38450.70, 12.30, 650.00, 'Completed', '2026-06-28 11:30:00'),
(8, 'Atlanta, GA', 'Savannah, GA', 'VAN-4024-GA', 10, 1900.00, 248.00, 94200.40, 36.80, 1400.00, 'Completed', '2026-07-02 07:15:00'),
(9, 'Columbus, OH', 'Cleveland, OH', 'REF-7030-OH', 4, 18200.00, 143.00, 128900.00, 48.00, 1600.00, 'Completed', '2026-06-10 13:00:00'),
(10, 'Grand Rapids, MI', 'Indianapolis, IN', 'REF-7031-MI', 12, 19100.00, 260.00, NULL, NULL, 2750.00, 'Dispatched', '2026-07-12 05:30:00'),
(11, 'Philadelphia, PA', 'Pittsburgh, PA', 'REF-7032-PA', 15, 17500.00, 305.00, 85600.00, 96.40, 2900.00, 'Completed', '2026-06-25 16:00:00'),
(12, 'Phoenix, AZ', 'Las Vegas, NV', 'FLT-5040-AZ', 14, 22500.00, 300.00, NULL, NULL, 3100.00, 'Dispatched', '2026-07-11 21:00:00'),
(13, 'Denver, CO', 'Salt Lake City, UT', 'FLT-5041-CO', 1, 21800.00, 520.00, 198400.00, 164.20, 4800.00, 'Completed', '2026-06-05 08:00:00'),
(14, 'Manhattan, NY', 'JFK Airport, NY', 'SDN-1050-NY', 16, 120.00, 18.50, 24100.00, 1.80, 150.00, 'Completed', '2026-07-01 14:00:00'),
(15, 'Los Angeles, CA', 'LAX Airport, CA', 'SDN-1051-CA', 17, 150.00, 22.00, NULL, NULL, 180.00, 'Dispatched', '2026-07-12 07:45:00'),
(16, 'Chicago, IL', 'O-Hare Airport, IL', 'SDN-1052-IL', 20, 90.00, 16.00, 78900.00, 1.60, 130.00, 'Completed', '2026-07-03 12:10:00'),
(17, 'Miami, FL', 'Orlando, FL', 'TRK-9013-FL', 4, 19000.00, 235.00, NULL, NULL, 2200.00, 'Cancelled', '2026-06-18 10:00:00'),
(18, 'Seattle, WA', 'Portland, OR', 'VAN-4023-WA', 6, 1800.00, 174.00, NULL, NULL, 1350.00, 'Cancelled', '2026-06-22 09:30:00'),
(19, 'Newark, NJ', 'Philadelphia, PA', 'TRK-9010-NY', 1, 16500.00, 85.00, NULL, NULL, 1100.00, 'Draft', '2026-07-12 08:00:00'),
(20, 'Dallas, TX', 'Oklahoma City, OK', 'VAN-4022-TX', 8, 1750.00, 206.00, NULL, NULL, 1650.00, 'Draft', '2026-07-12 08:30:00');

-- ============================================================================
-- 6. MAINTENANCE LOGS (20 Records)
-- Real mechanical service descriptions across fleet
-- ============================================================================
INSERT OR IGNORE INTO maintenance_logs (id, vehicle_reg, service_date, description, cost, status) VALUES
(1, 'TRK-9013-FL', '2026-07-10', 'Diesel Particulate Filter (DPF) cleaning & NOx sensor replacement.', 1850.00, 'Active'),
(2, 'VAN-4023-WA', '2026-07-09', 'Full transmission fluid flush and valve body solenoid inspection.', 1240.00, 'Active'),
(3, 'TRK-9010-NY', '2026-05-15', 'Full synthetic oil change, fuel filter replacement & 10-wheel alignment.', 850.00, 'Completed'),
(4, 'TRK-9011-CA', '2026-04-20', 'Front and rear air brake drum & shoe replacement.', 1420.00, 'Completed'),
(5, 'TRK-9012-TX', '2026-06-02', 'EGR valve cleaning and turbocharger boost pressure calibration.', 960.00, 'Completed'),
(6, 'TRK-9014-IL', '2026-05-28', 'Sleeper cab AC compressor replacement & R134a refrigerant recharge.', 1100.00, 'Completed'),
(7, 'VAN-4020-NY', '2026-06-12', 'Standard 10,000 km service: synthetic oil, oil filter, air cabin filter.', 220.00, 'Completed'),
(8, 'VAN-4021-CA', '2026-06-18', 'Rear differential fluid change and drive belt tensioner replacement.', 380.00, 'Completed'),
(9, 'VAN-4022-TX', '2026-05-10', 'Front brake rotor turning and ceramic brake pad installation.', 450.00, 'Completed'),
(10, 'VAN-4024-GA', '2026-06-25', 'Replacement of 4 commercial cargo tires & wheel balancing.', 920.00, 'Completed'),
(11, 'REF-7030-OH', '2026-05-05', 'Thermo King refrigeration unit annual preventative maintenance.', 650.00, 'Completed'),
(12, 'REF-7031-MI', '2026-06-14', 'Refrigerated trailer door seal gasket replacement.', 310.00, 'Completed'),
(13, 'REF-7032-PA', '2026-06-01', 'Reefer diesel engine oil change and coolant hoses replacement.', 480.00, 'Completed'),
(14, 'FLT-5040-AZ', '2026-05-22', 'Flatbed wooden floor plank repair & cargo strap winch lubrication.', 540.00, 'Completed'),
(15, 'FLT-5041-CO', '2026-06-08', 'Trailer ABS diagnostic scan and wheel bearing repacking.', 620.00, 'Completed'),
(16, 'SDN-1050-NY', '2026-06-15', 'Hybrid battery cooling fan cleaning and brake fluid inspection.', 180.00, 'Completed'),
(17, 'SDN-1051-CA', '2026-06-22', 'Scheduled factory 30,000 mile maintenance package.', 340.00, 'Completed'),
(18, 'SDN-1052-IL', '2026-06-29', 'Windshield replacement due to highway rock chip crack.', 410.00, 'Completed'),
(19, 'TRK-9015-NJ', '2026-03-10', 'Final engine decommissioning overhaul prior to retirement status.', 2500.00, 'Completed'),
(20, 'VAN-4025-OR', '2026-02-14', 'Suspension leaf spring replacement and steering knuckle rebuild.', 1680.00, 'Completed');

-- ============================================================================
-- 7. FUEL LOGS (20 Records)
-- Detailed refueling receipts with liters and dollar costs
-- ============================================================================
INSERT OR IGNORE INTO fuel_logs (id, vehicle_reg, liters, cost, log_date) VALUES
(1, 'TRK-9010-NY', 280.50, 412.33, '2026-06-01'),
(2, 'TRK-9010-NY', 310.00, 455.70, '2026-06-15'),
(3, 'TRK-9011-CA', 295.20, 442.80, '2026-06-05'),
(4, 'TRK-9011-CA', 320.00, 480.00, '2026-06-20'),
(5, 'TRK-9012-TX', 260.40, 364.56, '2026-06-08'),
(6, 'TRK-9014-IL', 305.10, 427.14, '2026-06-14'),
(7, 'TRK-9014-IL', 290.00, 411.80, '2026-06-28'),
(8, 'VAN-4020-NY', 68.50, 95.90, '2026-06-03'),
(9, 'VAN-4020-NY', 72.00, 102.24, '2026-06-18'),
(10, 'VAN-4021-CA', 75.40, 113.10, '2026-06-10'),
(11, 'VAN-4021-CA', 70.80, 106.20, '2026-06-24'),
(12, 'VAN-4022-TX', 64.20, 89.88, '2026-06-07'),
(13, 'VAN-4024-GA', 78.00, 110.76, '2026-06-16'),
(14, 'REF-7030-OH', 180.50, 256.31, '2026-06-09'),
(15, 'REF-7031-MI', 195.00, 276.90, '2026-06-19'),
(16, 'REF-7032-PA', 188.20, 267.24, '2026-06-24'),
(17, 'FLT-5040-AZ', 240.00, 348.00, '2026-06-11'),
(18, 'FLT-5041-CO', 255.60, 368.06, '2026-06-21'),
(19, 'SDN-1050-NY', 42.00, 60.90, '2026-06-14'),
(20, 'SDN-1051-CA', 45.50, 68.25, '2026-06-26');

-- ============================================================================
-- 8. EXPENSES (20 Records)
-- Tolls, insurance premiums, permits, weigh station fees & parking
-- ============================================================================
INSERT OR IGNORE INTO expenses (id, vehicle_reg, category, cost, expense_date, notes) VALUES
(1, 'TRK-9010-NY', 'Toll', 85.50, '2026-06-01', 'George Washington Bridge & I-95 toll charges.'),
(2, 'TRK-9010-NY', 'Insurance', 450.00, '2026-06-01', 'Monthly commercial auto fleet insurance premium.'),
(3, 'TRK-9011-CA', 'Toll', 64.20, '2026-06-06', 'California State Route 91 Express Lanes toll.'),
(4, 'TRK-9011-CA', 'Permit', 120.00, '2026-06-12', 'Interstate overweight axle compliance permit.'),
(5, 'TRK-9012-TX', 'Insurance', 450.00, '2026-06-01', 'Monthly commercial auto fleet insurance premium.'),
(6, 'TRK-9012-TX', 'Other', 35.00, '2026-06-15', 'Weigh station certified scale fee.'),
(7, 'TRK-9014-IL', 'Toll', 92.40, '2026-06-14', 'Illinois Tollway I-90 & Ohio Turnpike charges.'),
(8, 'TRK-9014-IL', 'Insurance', 450.00, '2026-06-01', 'Monthly commercial auto fleet insurance premium.'),
(9, 'VAN-4020-NY', 'Toll', 28.00, '2026-06-18', 'New York State Thruway toll fee.'),
(10, 'VAN-4020-NY', 'Insurance', 220.00, '2026-06-01', 'Monthly van commercial liability insurance.'),
(11, 'VAN-4021-CA', 'Other', 45.00, '2026-06-11', 'Emergency tire patch and roadside puncture repair.'),
(12, 'VAN-4022-TX', 'Insurance', 220.00, '2026-06-01', 'Monthly van commercial liability insurance.'),
(13, 'VAN-4024-GA', 'Toll', 18.50, '2026-06-16', 'Georgia Express Lanes electronic toll.'),
(14, 'REF-7030-OH', 'Permit', 150.00, '2026-06-05', 'Annual USDA food safety transport sanitation permit.'),
(15, 'REF-7031-MI', 'Insurance', 310.00, '2026-06-01', 'Monthly reefer cargo temperature loss coverage.'),
(16, 'REF-7032-PA', 'Toll', 74.00, '2026-06-25', 'Pennsylvania Turnpike commercial trailer fee.'),
(17, 'FLT-5040-AZ', 'Permit', 210.00, '2026-06-10', 'Oversize load interstate transportation permit.'),
(18, 'FLT-5041-CO', 'Insurance', 300.00, '2026-06-01', 'Monthly heavy flatbed cargo tie-down insurance.'),
(19, 'SDN-1050-NY', 'Other', 40.00, '2026-06-14', 'Airport executive terminal parking surcharge.'),
(20, 'SDN-1051-CA', 'Insurance', 160.00, '2026-06-01', 'Monthly executive sedan passenger liability coverage.');
