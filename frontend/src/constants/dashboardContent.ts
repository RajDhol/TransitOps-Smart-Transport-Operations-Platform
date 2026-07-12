import { UserRole } from './uiConfig';

export interface MockVehicle {
  registration_number: string;
  model: string;
  type: string;
  max_capacity: number;
  odometer: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  region: string; // <--- Added region for filtering
}

export interface MockDriver {
  id: number;
  name: string;
  license_expiry: string;
  safety_score: number;
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
  license_number?: string;
  license_category?: string;
  contact_number?: string;
}

export interface MockTrip {
  id: number;
  source: string;
  destination: string;
  vehicle_reg: string;
  driver_name: string;
  cargo_weight: number;
  planned_distance: number;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
  fuel_consumed?: number;
  final_odometer?: number;
}

export const INITIAL_VEHICLES: MockVehicle[] = [
  { registration_number: 'VAN-05-NY', model: 'Ford Transit', type: 'Van', max_capacity: 500, odometer: 12000, status: 'Available', region: 'NY' },
  { registration_number: 'TRK-02-CA', model: 'Volvo FH16', type: 'Heavy Truck', max_capacity: 15000, odometer: 85000, status: 'On Trip', region: 'CA' },
  { registration_number: 'SEMI-01-TX', model: 'Scania R500', type: 'Semi-Truck', max_capacity: 20000, odometer: 150000, status: 'In Shop', region: 'TX' },
  { registration_number: 'VAN-09-FL', model: 'Ram ProMaster', type: 'Van', max_capacity: 600, odometer: 8400, status: 'Available', region: 'FL' },
];

export const INITIAL_DRIVERS: MockDriver[] = [
  { id: 1, name: 'Alex', license_expiry: '2027-08-15', safety_score: 95, status: 'Available' },
  { id: 2, name: 'Sarah', license_expiry: '2026-07-20', safety_score: 98, status: 'On Trip' },
  { id: 3, name: 'David', license_expiry: '2026-05-10', safety_score: 82, status: 'Suspended' },
  { id: 4, name: 'Michael', license_expiry: '2026-08-01', safety_score: 74, status: 'Available' },
];

export const INITIAL_TRIPS: MockTrip[] = [
  { id: 101, source: 'Warehouse East', destination: 'Retail Hub A', vehicle_reg: 'TRK-02-CA', driver_name: 'Sarah', cargo_weight: 450, planned_distance: 120, status: 'Dispatched' },
  { id: 102, source: 'Distribution Center', destination: 'Local Depot B', vehicle_reg: 'VAN-05-NY', driver_name: 'Alex', cargo_weight: 350, planned_distance: 45, status: 'Draft' },
];

export const DASHBOARD_TITLES = {
  welcome: 'Welcome back',
  roleDescription: (role: string) => `Logged in as a ${role}.`,
  sandboxNotice: 'System running in development sandbox mode.',
};

export const TABLE_HEADERS = {
  vehicles: ['Reg Number', 'Model', 'Type', 'Max Cap', 'Odometer', 'Region', 'Status'],
  drivers: ['Driver Name', 'License Expiry', 'Safety Score', 'Current Status', 'Actions'],
  roi: ['Vehicle', 'Acquisition Cost', 'Maintenance Cost', 'Fuel Cost', 'Revenue Earned', 'Calculated ROI'],
};

// --- CENTRAL FILTER CONFIGURATION OPTIONS ---
export const FILTER_OPTIONS = {
  types: [
    { value: '', label: 'All Types' },
    { value: 'Van', label: 'Van' },
    { value: 'Heavy Truck', label: 'Heavy Truck' },
    { value: 'Semi-Truck', label: 'Semi-Truck' },
  ],
  statuses: [
    { value: '', label: 'All Statuses' },
    { value: 'Available', label: 'Available' },
    { value: 'On Trip', label: 'On Trip' },
    { value: 'In Shop', label: 'In Shop' },
    { value: 'Retired', label: 'Retired' },
  ],
  regions: [
    { value: '', label: 'All Regions' },
    { value: 'NY', label: 'New York (NY)' },
    { value: 'CA', label: 'California (CA)' },
    { value: 'TX', label: 'Texas (TX)' },
    { value: 'FL', label: 'Florida (FL)' },
  ],
};
