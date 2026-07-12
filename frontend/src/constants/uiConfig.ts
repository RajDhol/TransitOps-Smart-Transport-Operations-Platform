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
    name: 'Vehicle Registry',
    href: '/vehicles',
    allowedRoles: ['Fleet Manager'],
  },
  {
    name: 'Driver Management',
    href: '/drivers',
    allowedRoles: ['Fleet Manager', 'Safety Officer'],
  },
  {
    name: 'Trip Management',
    href: '/trips',
    allowedRoles: ['Fleet Manager', 'Driver'],
  },
  {
    name: 'Maintenance Logs',
    href: '/maintenance',
    allowedRoles: ['Fleet Manager'],
  },
  {
    name: 'Fuel & Expenses',
    href: '/expenses',
    allowedRoles: ['Fleet Manager', 'Financial Analyst'],
  },
  {
    name: 'Reports & Analytics',
    href: '/reports',
    allowedRoles: ['Fleet Manager', 'Financial Analyst'],
  },
];
