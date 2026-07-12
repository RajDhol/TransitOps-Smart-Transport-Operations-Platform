import { FormFieldSchema } from '../components/ui/DynamicForm';

export const DRIVER_PAGE_TITLES = {
  header: 'Driver Management',
  description: 'Track driver qualifications, monitor license expiry status, review safety metrics, and register new drivers.',
  registerButton: 'Add New Driver',
  listTitle: 'Active Driver Pool',
  formTitle: 'Add Driver Profile',
  formSubtitle: 'Register a new operator with credentials and contact details.',
  searchPlaceholder: 'Search by driver name or license number...',
};

export const LICENSE_CATEGORIES = [
  { value: 'Class A CDL', label: 'Class A CDL (Heavy combination)' },
  { value: 'Class B CDL', label: 'Class B CDL (Single commercial)' },
  { value: 'Class C CDL', label: 'Class C CDL (Standard commercial)' },
];

export const DRIVER_STATUSES = [
  { value: 'Available', label: 'Available' },
  { value: 'Off Duty', label: 'Off Duty' },
  { value: 'Suspended', label: 'Suspended' },
];

export const DRIVER_TABLE_HEADERS = [
  'ID',
  'Driver Name',
  'License Number',
  'License Class',
  'Expiry Date',
  'Contact',
  'Safety Score',
  'Status',
  'Actions',
];

export const DRIVER_FORM_SCHEMA: FormFieldSchema[] = [
  {
    name: 'name',
    label: 'Driver Full Name',
    type: 'text',
    placeholder: 'e.g. Carlos Ramirez',
    required: true,
  },
  {
    name: 'license_number',
    label: 'Driver License Number',
    type: 'text',
    placeholder: 'e.g. DL-NY-849201',
    required: true,
  },
  {
    name: 'license_category',
    label: 'License Category / Class',
    type: 'select',
    options: LICENSE_CATEGORIES,
    required: true,
  },
  {
    name: 'license_expiry_date',
    label: 'License Expiry Date (YYYY-MM-DD)',
    type: 'text',
    placeholder: 'e.g. 2028-05-14',
    required: true,
  },
  {
    name: 'contact_number',
    label: 'Contact Number',
    type: 'text',
    placeholder: 'e.g. +1-555-0101',
    required: true,
  },
  {
    name: 'safety_score',
    label: 'Initial Safety Score (0-100)',
    type: 'number',
    placeholder: '95',
    required: true,
  },
  {
    name: 'status',
    label: 'Initial Status',
    type: 'select',
    options: DRIVER_STATUSES,
    required: true,
  },
];
