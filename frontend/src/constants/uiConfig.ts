export type UserRole = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';

export interface NavItem {
  name: string;
  href: string;
  allowedRoles: UserRole[];
}

export const USER_ROLES: UserRole[] = [
  'Fleet Manager',
  'Driver',
  'Safety Officer',
  'Financial Analyst',
];

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    allowedRoles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'],
  },
  {
    name: 'Fleet',
    href: '/vehicles',
    allowedRoles: ['Fleet Manager', 'Driver', 'Financial Analyst'], // Added Driver and Financial Analyst (View-Only)
  },
  {
    name: 'Drivers',
    href: '/drivers',
    allowedRoles: ['Fleet Manager', 'Safety Officer'],
  },
  {
    name: 'Trips',
    href: '/trips',
    allowedRoles: ['Fleet Manager', 'Driver', 'Safety Officer'], // Added Safety Officer (View-Only)
  },
  {
    name: 'Maintenance',
    href: '/maintenance',
    allowedRoles: ['Fleet Manager'],
  },
  {
    name: 'Fuel & Expenses',
    href: '/expenses',
    allowedRoles: ['Fleet Manager', 'Financial Analyst'],
  },
  {
    name: 'Analytics',
    href: '/reports',
    allowedRoles: ['Fleet Manager', 'Financial Analyst'],
  },
  {
    name: 'Settings',
    href: '/settings',
    allowedRoles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'],
  },
];
