import { FormFieldSchema } from '../components/ui/DynamicForm';

export const VEHICLE_PAGE_TITLES = {
  header: 'Vehicle Registry',
  description: 'Manage fleet assets, track mileage, monitor maintenance status, and register new vehicles.',
  registerButton: 'Register New Vehicle',
  listTitle: 'Fleet Overview',
  formTitle: 'Register Vehicle Detail',
  formSubtitle: 'Add a new transport asset to the active registry pool.',
  searchPlaceholder: 'Search by registration number or model...',
};

export const VEHICLE_TYPES = [
  { value: 'Van', label: 'Van' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Sedan', label: 'Sedan' },
  { value: 'Refrigerated Truck', label: 'Refrigerated Truck' },
  { value: 'Flatbed', label: 'Flatbed' },
];

export const REGIONS = [
  { value: 'NY', label: 'New York (NY)' },
  { value: 'CA', label: 'California (CA)' },
  { value: 'TX', label: 'Texas (TX)' },
  { value: 'FL', label: 'Florida (FL)' },
];

export const VEHICLE_STATUSES = [
  { value: 'Available', label: 'Available' },
  { value: 'In Shop', label: 'In Shop (Maintenance)' },
  { value: 'Retired', label: 'Retired' },
];

export const VEHICLE_TABLE_HEADERS = [
  'Reg Number',
  'Model / Model Name',
  'Type',
  'Max Load Capacity',
  'Odometer Reading',
  'Acquisition Cost',
  'Region',
  'Status',
  'Actions',
];

export const VEHICLE_FORM_SCHEMA: FormFieldSchema[] = [
  {
    name: 'registration_number',
    label: 'Registration Number (Unique)',
    type: 'text',
    placeholder: 'e.g. VAN-10-NY',
    required: true,
  },
  {
    name: 'model',
    label: 'Model / Name',
    type: 'text',
    placeholder: 'e.g. Ford Transit Cargo',
    required: true,
  },
  {
    name: 'type',
    label: 'Vehicle Type',
    type: 'select',
    options: VEHICLE_TYPES,
    required: true,
  },
  {
    name: 'max_capacity',
    label: 'Maximum Load Capacity (kg)',
    type: 'number',
    placeholder: '500',
    required: true,
  },
  {
    name: 'odometer',
    label: 'Odometer Reading (km)',
    type: 'number',
    placeholder: '12000',
    required: true,
  },
  {
    name: 'acquisition_cost',
    label: 'Acquisition Cost ($)',
    type: 'number',
    placeholder: '25000',
    required: true,
  },
  {
    name: 'region',
    label: 'Region / State',
    type: 'select',
    options: REGIONS,
    required: true,
  },
  {
    name: 'status',
    label: 'Initial Fleet Status',
    type: 'select',
    options: VEHICLE_STATUSES,
    required: true,
  },
];
