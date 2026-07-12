import { UserRole } from './uiConfig';

export interface MockVehicle {
  registration_number: string;
  model: string;
  type: string;
  max_capacity: number;
  odometer: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
}

export interface MockDriver {
  id: number;
  name: string;
  license_expiry: string;
  safety_score: number;
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
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
  { registration_number: 'Van-05', model: 'Ford Transit', type: 'Van', max_capacity: 500, odometer: 12000, status: 'Available' },
  { registration_number: 'Truck-02', model: 'Volvo FH16', type: 'Heavy Truck', max_capacity: 15000, odometer: 85000, status: 'On Trip' },
  { registration_number: 'Semi-01', model: 'Scania R500', type: 'Semi-Truck', max_capacity: 20000, odometer: 150000, status: 'In Shop' },
];

export const INITIAL_DRIVERS: MockDriver[] = [
  { id: 1, name: 'Alex', license_expiry: '2027-08-15', safety_score: 95, status: 'Available' },
  { id: 2, name: 'Sarah', license_expiry: '2026-07-20', safety_score: 98, status: 'On Trip' },
  { id: 3, name: 'David', license_expiry: '2026-05-10', safety_score: 82, status: 'Suspended' },
  { id: 4, name: 'Michael', license_expiry: '2026-08-01', safety_score: 74, status: 'Available' },
];

export const INITIAL_TRIPS: MockTrip[] = [
  { id: 101, source: 'Warehouse East', destination: 'Retail Hub A', vehicle_reg: 'Truck-02', driver_name: 'Sarah', cargo_weight: 450, planned_distance: 120, status: 'Dispatched' },
  { id: 102, source: 'Distribution Center', destination: 'Local Depot B', vehicle_reg: 'Van-05', driver_name: 'Alex', cargo_weight: 350, planned_distance: 45, status: 'Draft' },
];

export const DASHBOARD_TITLES = {
  welcome: 'Welcome back',
  roleDescription: (role: string) => `Logged in as a ${role}.`,
  sandboxNotice: 'System running in development sandbox mode.',
};

export const TABLE_HEADERS = {
  vehicles: ['Reg Number', 'Model', 'Type', 'Max Cap', 'Odometer', 'Status'],
  drivers: ['Driver Name', 'License Expiry', 'Safety Score', 'Current Status', 'Actions'],
  roi: ['Vehicle', 'Acquisition Cost', 'Maintenance Cost', 'Fuel Cost', 'Revenue Earned', 'Calculated ROI'],
};
