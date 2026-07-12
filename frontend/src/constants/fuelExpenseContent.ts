import { FormFieldSchema } from '../components/ui/DynamicForm';

export const FUEL_EXPENSE_TITLES = {
  header: 'Fuel & Expense Management',
  description: 'Track fuel logs and operational overhead expenses side by side to calculate real-time fleet costs.',
  fuelTitle: 'FUEL LOGS',
  expenseTitle: 'OTHER EXPENSES (TOLL / MISC)',
  fuelButton: '+ Log Fuel',
  expenseButton: '+ Add Expense',
  totalLabel: 'TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINTENANCE + EXTRA',
};

export const FUEL_TABLE_HEADERS = [
  'VEHICLE',
  'DATE',
  'LITERS',
  'FUEL COST',
  'ACTIONS',
];

export const EXPENSE_TABLE_HEADERS = [
  'TRIP',
  'VEHICLE',
  'TOLL',
  'OTHER',
  'MAINT. (LINKED)',
  'TOTAL (STATUS)',
  'ACTIONS',
];

export const FUEL_FORM_SCHEMA: FormFieldSchema[] = [
  {
    name: 'date',
    label: 'Date (e.g. 05 Jul 2026)',
    type: 'text',
    placeholder: '05 Jul 2026',
    required: true,
  },
  {
    name: 'liters',
    label: 'Liters Refilled (L)',
    type: 'number',
    placeholder: '42',
    required: true,
  },
  {
    name: 'cost',
    label: 'Fuel Cost ($)',
    type: 'number',
    placeholder: '3150',
    required: true,
  },
];

export const EXPENSE_FORM_SCHEMA: FormFieldSchema[] = [
  {
    name: 'trip_id',
    label: 'Trip ID',
    type: 'text',
    placeholder: 'TR001',
    required: true,
  },
  {
    name: 'toll',
    label: 'Toll Expenses ($)',
    type: 'number',
    placeholder: '120',
    required: true,
  },
  {
    name: 'other',
    label: 'Other Expenses ($)',
    type: 'number',
    placeholder: '0',
    required: true,
  },
  {
    name: 'maint',
    label: 'Maintenance Cost Linked ($)',
    type: 'number',
    placeholder: '0',
    required: true,
  },
  {
    name: 'status',
    label: 'Status / Availability',
    type: 'select',
    options: [
      { value: 'Available', label: 'Available' },
      { value: 'Completed', label: 'Completed' },
    ],
    required: true,
  },
];
