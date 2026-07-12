import { FormFieldSchema } from '../components/ui/DynamicForm';

export const EXPENSE_PAGE_TITLES = {
  header: 'Expense Logging',
  description: 'Log and track non-fuel operational costs, including tolls, insurance premiums, compliance permits, and weigh-scale fees.',
  logButton: 'Log New Expense',
  listTitle: 'Operational Expenses Logs',
  formTitle: 'Log Expense Record',
  formSubtitle: 'Enter cost items from business operations to calculate total fleet ROI.',
  searchPlaceholder: 'Search expenses by vehicle key or notes...',
};

export const EXPENSE_CATEGORIES = [
  { value: 'Toll', label: 'Toll' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Permit', label: 'Permit' },
  { value: 'Weigh Station', label: 'Weigh Station' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Other', label: 'Other' },
];

export const EXPENSE_TABLE_HEADERS = [
  'Expense ID',
  'Vehicle Key',
  'Category',
  'Cost / Amount',
  'Date logged',
  'Description / Notes',
  'Actions',
];

export const EXPENSE_FORM_SCHEMA: FormFieldSchema[] = [
  {
    name: 'category',
    label: 'Expense Category',
    type: 'select',
    options: EXPENSE_CATEGORIES,
    required: true,
  },
  {
    name: 'cost',
    label: 'Expense Amount ($)',
    type: 'number',
    placeholder: 'e.g. 120.00',
    required: true,
  },
  {
    name: 'date',
    label: 'Expense Date (YYYY-MM-DD)',
    type: 'text',
    placeholder: 'e.g. 2026-07-12',
    required: true,
  },
  {
    name: 'notes',
    label: 'Expense Details / Notes',
    type: 'text',
    placeholder: 'e.g. Annual overweight axle compliance permit',
    required: true,
  },
];
