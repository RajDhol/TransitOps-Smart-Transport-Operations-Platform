export const SETTINGS_TITLES = {
  header: 'Settings & RBAC',
  description: 'Manage general depot configurations and inspect role-based system access permissions.',
  generalTitle: 'GENERAL',
  rbacTitle: 'ROLE-BASED ACCESS (RBAC)',
  saveButton: 'Save changes',
};

export const RBAC_HEADERS = [
  'ROLE',
  'FLEET',
  'DRIVERS',
  'TRIPS',
  'FUEL/EXP.',
  'ANALYTICS',
];

export interface RbacRow {
  role: string;
  fleet: string;
  drivers: string;
  trips: string;
  fuelExp: string;
  analytics: string;
}

export const RBAC_MATRIX: RbacRow[] = [
  {
    role: 'Fleet Manager',
    fleet: '✓',
    drivers: '✓',
    trips: '—',
    fuelExp: '—',
    analytics: '✓',
  },
  {
    role: 'Dispatcher (Driver)',
    fleet: 'View',
    drivers: '—',
    trips: '✓',
    fuelExp: '—',
    analytics: '—',
  },
  {
    role: 'Safety Officer',
    fleet: '—',
    drivers: '✓',
    trips: 'View',
    fuelExp: '—',
    analytics: '—',
  },
  {
    role: 'Financial Analyst',
    fleet: 'View',
    drivers: '—',
    trips: '—',
    fuelExp: '✓',
    analytics: '✓',
  },
];
