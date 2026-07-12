'use client';

import React, { useState } from 'react';
import { INITIAL_VEHICLES, MockVehicle } from '../../constants/dashboardContent';
import {
  MAINTENANCE_PAGE_TITLES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_TABLE_HEADERS
} from '../../constants/maintenanceContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm, { FormFieldSchema } from '../../components/ui/DynamicForm';

interface MockMaintenance {
  id: number;
  vehicle_reg: string;
  service_date: string;
  description: string;
  cost: number;
  status: 'Active' | 'Completed';
}

export default function MaintenanceLogsPage() {
  // Core states
  const [vehicles, setVehicles] = useState<MockVehicle[]>(INITIAL_VEHICLES);
  const [maintenances, setMaintenances] = useState<MockMaintenance[]>([
    { id: 1, vehicle_reg: 'SEMI-01-TX', service_date: '2026-07-10', description: 'Transmission fluid flush and gear inspection', cost: 1240, status: 'Active' },
    { id: 2, vehicle_reg: 'VAN-05-NY', service_date: '2026-06-15', description: 'Oil change and 4-wheel balancing', cost: 220, status: 'Completed' },
  ]);

  // Dialog toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- DYNAMIC FORM FIELD BUILDER ---
  const getFormSchema = (): FormFieldSchema[] => {
    // Exclude retired vehicles from options
    const activeVehicles = vehicles.filter((v) => v.status !== 'Retired');

    return [
      {
        name: 'vehicle_reg',
        label: 'Select Vehicle',
        type: 'select',
        options: activeVehicles.map((v) => ({
          value: v.registration_number,
          label: `${v.registration_number} (${v.model} - Status: ${v.status})`,
        })),
        required: true,
      },
      { name: 'service_date', label: 'Service Date', type: 'date', required: true },
      { name: 'cost', label: 'Service Cost ($)', type: 'number', placeholder: 'e.g. 350', required: true },
      { name: 'description', label: 'Service Description', type: 'text', placeholder: 'e.g. Oil change and brake pads replacement', required: true },
    ];
  };

  // --- ACTIONS & TRIGGERS VALIDATION ---
  const handleFormSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    setNotification(null);
    const errors: Record<string, string> = {};

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      errors.cost = 'Service cost must be a positive number.';
    }

    if (!formData.service_date) {
      errors.service_date = 'Service date is required.';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Service description is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const regNo = formData.vehicle_reg;

    const newLogId = maintenances.length + 1001;
    const addedLog: MockMaintenance = {
      id: newLogId,
      vehicle_reg: regNo,
      service_date: formData.service_date,
      description: formData.description.trim(),
      cost: cost,
      status: 'Active',
    };

    setMaintenances([addedLog, ...maintenances]);
    
    // TRIGGER: Setting a vehicle to active maintenance sets its status to 'In Shop'
    setVehicles(
      vehicles.map((v) => (v.registration_number === regNo ? { ...v, status: 'In Shop' } : v))
    );

    setIsModalOpen(false);
    setNotification({
      type: 'success',
      message: `Maintenance Ticket #${newLogId} logged. Vehicle ${regNo} status set to In Shop.`,
    });
  };

  const handleCompleteLog = (id: number) => {
    const target = maintenances.find((m) => m.id === id);
    if (!target) return;

    setMaintenances(
      maintenances.map((m) => (m.id === id ? { ...m, status: 'Completed' } : m))
    );

    // TRIGGER: Closing maintenance restores vehicle status to 'Available' (unless retired)
    const vehicle = vehicles.find((v) => v.registration_number === target.vehicle_reg);
    if (vehicle && vehicle.status !== 'Retired') {
      setVehicles(
        vehicles.map((v) =>
          v.registration_number === target.vehicle_reg ? { ...v, status: 'Available' } : v
        )
      );
    }

    setNotification({
      type: 'success',
      message: `Maintenance Ticket #${id} marked as Completed. Vehicle ${target.vehicle_reg} is now Available.`,
    });
  };

  // --- FILTERS ---
  const filteredLogs = maintenances.filter((m) => {
    const matchesSearch =
      m.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 border text-sm font-medium rounded flex items-start gap-2.5 bg-green-50 border-green-200 text-green-800`}
        >
          <span>✓</span>
          <div>
            <p className="font-semibold">Success</p>
            <p className="mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Roster list */}
      <Card
        title={MAINTENANCE_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            {/* Action button inside card header */}
            <Button onClick={() => { setFormErrors({}); setIsModalOpen(true); }} size="sm">
              {MAINTENANCE_PAGE_TITLES.logButton}
            </Button>
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
              {MAINTENANCE_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
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
              {filteredLogs.map((m) => (
                <tr key={m.id} className="text-gray-700">
                  <td className="py-3 font-semibold">#{m.id}</td>
                  <td className="py-3 font-mono text-xs">{m.vehicle_reg}</td>
                  <td className="py-3">{m.service_date}</td>
                  <td className="py-3">{m.description}</td>
                  <td className="py-3 font-semibold">${m.cost.toLocaleString()}</td>
                  <td className="py-3">
                    <Badge color={m.status === 'Completed' ? 'success' : 'warning'}>
                      {m.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right flex justify-end gap-2">
                    {m.status === 'Active' && (
                      <Button variant="success" size="sm" onClick={() => handleCompleteLog(m.id)}>
                        Mark Completed
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={MAINTENANCE_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No maintenance records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={MAINTENANCE_PAGE_TITLES.formTitle}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">{MAINTENANCE_PAGE_TITLES.formSubtitle}</p>
        </div>
        <DynamicForm
          schema={getFormSchema()}
          onSubmit={handleFormSubmit}
          submitLabel="Log Maintenance Repair"
          errors={formErrors}
        />
      </Modal>
    </div>
  );
}
