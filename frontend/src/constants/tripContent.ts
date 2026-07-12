import { FormFieldSchema } from '../components/ui/DynamicForm';

export const TRIP_PAGE_TITLES = {
  header: 'Trip Management',
  description: 'Dispatch transport routes, track cargo parameters, verify operator availability, and log fuel/mileage data upon completion.',
  dispatchButton: 'Dispatch New Trip',
  listTitle: 'Route Logs & Dispatches',
  formTitle: 'Dispatch Trip Details',
  formSubtitle: 'Assigned vehicle and driver must be active and Available in the registry.',
  completeTitle: 'Complete Route Logs',
  completeSubtitle: 'Record final odometer readings and fuel consumption reports to complete the trip.',
  searchPlaceholder: 'Search by source, destination, or vehicle registration...',
};

export const TRIP_STATUSES = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Dispatched', label: 'Dispatched' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const TRIP_TABLE_HEADERS = [
  'Trip ID',
  'Route / Destination',
  'Vehicle Key',
  'Driver Assigned',
  'Cargo Weight',
  'Planned Distance',
  'Fuel Consumed',
  'Final Odometer',
  'Status',
  'Actions',
];
