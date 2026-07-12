'use client';

import React, { useState } from 'react';
import { INITIAL_VEHICLES, MockVehicle } from '../../constants/dashboardContent';
import {
  MAINTENANCE_PAGE_TITLES,
  MAINTENANCE_TABLE_HEADERS,
  MAINTENANCE_STATUSES
} from '../../constants/maintenanceContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm, { FormFieldSchema } from '../../components/ui/DynamicForm';

interface MockMaintenanceLog {
  id: number;
  vehicle_reg: string;
  service_date: string;
  description: string;
  cost: number;
  status: 'Active' | 'Completed';
}

export default function MaintenanceLogsPage() {
  // Mock states
  const [vehicles, setVehicles] = useState<MockVehicle[]>(INITIAL_VEHICLES);
  const [logs, setLogs] = useState<MockMaintenanceLog[]>([
    { id: 1, vehicle_reg: 'SEMI-01-TX', service_date: '2026-07-10', description: 'Transmission fluid flush and gear inspection', cost: 1240, status: 'Active' },
    { id: 2, vehicle_reg: 'VAN-05-NY', service_date: '2026-06-15', description: 'Oil change and 4-wheel balancing', cost: 220, status: 'Completed' },
  ]);

  // Dialog toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- DYNAMIC FORM SCHEMA ---
  const getLogSchema = (): FormFieldSchema[] => {
    return [
      {
        name: 'vehicle_reg',
        label: 'Select Vehicle Registry Key',
        type: 'select',
        options: vehicles.map((v) => ({
          value: v.registration_number,
          label: `${v.registration_number} (${v.model} - Status: ${v.status})`,
        })),
        required: true,
      },
      { name: 'service_date', label: 'Service Date (YYYY-MM-DD)', type: 'text', placeholder: 'e.g. 2026-07-12', required: true },
      { name: 'description', label: 'Work Order Description', type: 'text', placeholder: 'e.g. Engine tune-up & spark plugs replacement', required: true },
      { name: 'cost', label: 'Repair Cost ($)', type: 'number', placeholder: 'e.g. 150', required: true },
      { name: 'status', label: 'Service Status', type: 'select', options: MAINTENANCE_STATUSES, required: true },
    ];
  };

  // --- ACTIONS & BUSINESS TRIGGERS ---
  
  const handleLogSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    setNotification(null);
    const errors: Record<string, string> = {};

    const costVal = parseFloat(formData.cost);
    if (isNaN(costVal) || costVal < 0) {
      errors.cost = 'Cost cannot be negative.';
    }

    if (!formData.service_date?.trim()) {
      errors.service_date = 'Service date is required.';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.service_date.trim())) {
        errors.service_date = 'Expiry date must be in YYYY-MM-DD format.';
      }
    }

    if (!formData.description?.trim()) {
      errors.description = 'Work order description is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const nextId = logs.length + 1;
    const isTicketActive = formData.status === 'Active';

    // TRIGGER: If ticket is Active, set vehicle status to In Shop
    if (isTicketActive) {
      setVehicles(
        vehicles.map((v) =>
          v.registration_number === formData.vehicle_reg ? { ...v, status: 'In Shop' } : v
        )
      );
    }

    const newLog: MockMaintenanceLog = {
      id: nextId,
      vehicle_reg: formData.vehicle_reg,
      service_date: formData.service_date.trim(),
      description: formData.description.trim(),
      cost: costVal,
      status: formData.status as any,
    };

    setLogs([newLog, ...logs]);
    setIsModalOpen(false);
    setNotification({
      type: 'success',
      message: `Maintenance Ticket #${nextId} logged successfully. ${
        isTicketActive ? 'Vehicle status updated to In Shop.' : ''
      }`,
    });
  };

  const handleCompleteTicket = (ticketId: number) => {
    const target = logs.find((l) => l.id === ticketId);
    if (!target) return;

    // Save state changes
    setLogs(logs.map((l) => (l.id === ticketId ? { ...l, status: 'Completed' } : l)));

    // TRIGGER: Closing maintenance restores vehicle status to Available (unless retired)
    setVehicles(
      vehicles.map((v) => {
        if (v.registration_number === target.vehicle_reg) {
          if (v.status !== 'Retired') {
            return { ...v, status: 'Available' };
          }
        }
        return v;
      })
    );

    setNotification({
      type: 'success',
      message: `Ticket #${ticketId} closed. Vehicle ${target.vehicle_reg} status restored to Available.`,
    });
  };

  const handleDeleteTicket = (ticketId: number) => {
    const target = logs.find((l) => l.id === ticketId);
    if (!target) return;

    setLogs(logs.filter((l) => l.id !== ticketId));

    // If deleting active ticket, reset vehicle status to Available
    if (target.status === 'Active') {
      setVehicles(
        vehicles.map((v) =>
          v.registration_number === target.vehicle_reg && v.status === 'In Shop'
            ? { ...v, status: 'Available' }
            : v
        )
      );
    }

    setNotification({
      type: 'success',
      message: `Ticket #${ticketId} removed.`,
    });
  };

  // --- FILTERS ---
  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 border text-sm font-medium rounded flex items-start gap-2.5 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '!'}</span>
          <div>
            <p className="font-semibold">{notification.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{MAINTENANCE_PAGE_TITLES.header}</h2>
          <p className="text-sm text-gray-500 mt-1">{MAINTENANCE_PAGE_TITLES.description}</p>
        </div>
        <Button onClick={() => { setFormErrors({}); setIsModalOpen(true); }}>
          {MAINTENANCE_PAGE_TITLES.logButton}
        </Button>
      </div>

      {/* Table Records */}
      <Card
        title={MAINTENANCE_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={MAINTENANCE_PAGE_TITLES.searchPlaceholder}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none focus:border-indigo-500 bg-white w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none bg-white"
            >
              <option value="">All Statuses</option>
              {MAINTENANCE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                {MAINTENANCE_TABLE_HEADERS.map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="text-gray-700">
                  <td className="py-3 font-semibold">#{l.id}</td>
                  <td className="py-3 font-mono text-xs">{l.vehicle_reg}</td>
                  <td className="py-3">{l.service_date}</td>
                  <td className="py-3 font-medium text-gray-900">{l.description}</td>
                  <td className="py-3">${l.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3">
                    <Badge color={l.status === 'Active' ? 'warning' : 'success'}>
                      {l.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right flex justify-end gap-2">
                    {l.status === 'Active' && (
                      <Button variant="success" size="sm" onClick={() => handleCompleteTicket(l.id)}>
                        Ready / Complete
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => handleDeleteTicket(l.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={MAINTENANCE_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No tickets found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Centralized Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={MAINTENANCE_PAGE_TITLES.formTitle}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">{MAINTENANCE_PAGE_TITLES.formSubtitle}</p>
        </div>
        <DynamicForm
          schema={getLogSchema()}
          onSubmit={handleLogSubmit}
          submitLabel="Log Service Ticket"
          errors={formErrors}
        />
      </Modal>
    </div>
  );
}
