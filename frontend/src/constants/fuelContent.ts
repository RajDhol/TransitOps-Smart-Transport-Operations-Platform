import { FormFieldSchema } from '../components/ui/DynamicForm';

export const FUEL_PAGE_TITLES = {
  header: 'Fuel Logging',
  description: 'Record fuel refills, track liters consumed, monitor refueling costs, and analyze mileage efficiency.',
  logButton: 'Log Refill Receipt',
  listTitle: 'Fuel History Logs',
  formTitle: 'Log Fuel Refill',
  formSubtitle: 'Enter details from the refueling receipt to track operational usage.',
  searchPlaceholder: 'Search fuel logs by vehicle key...',
};

export const FUEL_TABLE_HEADERS = [
  'Refill ID',
  'Vehicle Key',
  'Liters Refilled',
  'Total Cost',
  'Refuel Date',
  'Actions',
];

export const FUEL_FORM_SCHEMA: FormFieldSchema[] = [
  {
    name: 'liters',
    label: 'Liters Refilled',
    type: 'number',
    placeholder: 'e.g. 50',
    required: true,
  },
  {
    name: 'cost',
    label: 'Total Cost ($)',
    type: 'number',
    placeholder: 'e.g. 75.50',
    required: true,
  },
  {
    name: 'date',
    label: 'Refuel Date (YYYY-MM-DD)',
    type: 'text',
    placeholder: 'e.g. 2026-07-12',
    required: true,
  },
];
