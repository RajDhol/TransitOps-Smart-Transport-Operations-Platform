'use client';

import React, { useState, useEffect } from 'react';
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

interface Vehicle {
  registration_number: string;
  model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
}

interface Maintenance {
  id: number;
  vehicle_reg: string;
  service_date: string;
  description: string;
  cost: number;
  status: 'Active' | 'Completed';
}

export default function MaintenanceLogsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- API DATA FETCH ---
  const fetchData = async () => {
    try {
      const [vRes, mRes] = await Promise.all([
        fetch('http://localhost:8000/api/vehicles'),
        fetch('http://localhost:8000/api/maintenance')
      ]);

      if (vRes.ok && mRes.ok) {
        const vData = await vRes.json();
        const mData = await mRes.json();
        setVehicles(vData);
        setMaintenances(mData);
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to synchronize with server API.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
  const handleFormSubmit = async (formData: Record<string, string>) => {
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

    try {
      const res = await fetch('http://localhost:8000/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_reg: formData.vehicle_reg,
          service_date: formData.service_date,
          cost: cost,
          description: formData.description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit maintenance entry.');
      }

      setNotification({
        type: 'success',
        message: `Maintenance Ticket #${data.maintenance_id} logged. Vehicle status set to In Shop.`,
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCompleteLog = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/maintenance/${id}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to close ticket.');
      }

      setNotification({
        type: 'success',
        message: `Maintenance Ticket #${id} marked as Completed. Vehicle is now Available.`,
      });
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
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
          className={`p-4 border text-sm font-medium rounded flex items-start gap-2.5 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '✖'}</span>
          <div>
            <p className="font-semibold">{notification.type === 'success' ? 'Success' : 'Error'}</p>
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
              {isLoading ? (
                <tr>
                  <td colSpan={MAINTENANCE_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    Loading records from database...
                  </td>
                </tr>
              ) : filteredLogs.map((m) => (
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

              {!isLoading && filteredLogs.length === 0 && (
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
