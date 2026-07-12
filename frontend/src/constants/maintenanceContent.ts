import { FormFieldSchema } from '../components/ui/DynamicForm';

export const MAINTENANCE_PAGE_TITLES = {
  header: 'Maintenance Logs',
  description: 'Log mechanical issues, track service costs, monitor work statuses, and manage vehicle shop cycles.',
  logButton: 'Log Maintenance Ticket',
  listTitle: 'Service History & Logs',
  formTitle: 'Log Service Ticket',
  formSubtitle: 'Flagging a vehicle as Active will set its fleet status to In Shop.',
  searchPlaceholder: 'Search by registration number or service description...',
};

export const MAINTENANCE_STATUSES = [
  { value: 'Active', label: 'Active (In Shop)' },
  { value: 'Completed', label: 'Completed (Ready)' },
];

export const MAINTENANCE_TABLE_HEADERS = [
  'Ticket ID',
  'Vehicle Key',
  'Service Date',
  'Work Description',
  'Maintenance Cost',
  'Status',
  'Actions',
];
