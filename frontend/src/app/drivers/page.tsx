'use client';

import React, { useState } from 'react';
import { INITIAL_DRIVERS, MockDriver } from '../../constants/dashboardContent';
import {
  DRIVER_PAGE_TITLES,
  DRIVER_STATUSES,
  DRIVER_TABLE_HEADERS,
  DRIVER_FORM_SCHEMA
} from '../../constants/driverContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';

export default function DriverManagementPage() {
  // Mock drivers pool state
  const [drivers, setDrivers] = useState<MockDriver[]>(INITIAL_DRIVERS);

  // Dialog & Filter toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- ACTIONS & COMPLIANCE VALIDATIONS ---
  const handleFormSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    setNotification(null);

    const errors: Record<string, string> = {};

    // 1. Validations checks
    if (!formData.name?.trim()) {
      errors.name = 'Driver name is required.';
    }

    if (!formData.license_number?.trim()) {
      errors.license_number = 'License number is required.';
    } else {
      // Uniqueness check
      const exists = drivers.some(
        (d) => (d.license_number || '').toLowerCase() === formData.license_number.trim().toLowerCase()
      );
      if (exists) {
        errors.license_number = 'This license number is already registered.';
      }
    }

    if (!formData.license_expiry_date?.trim()) {
      errors.license_expiry_date = 'License expiry date is required.';
    } else {
      // Simple date format regex validation YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.license_expiry_date.trim())) {
        errors.license_expiry_date = 'Expiry date must be in YYYY-MM-DD format.';
      }
    }

    if (!formData.contact_number?.trim()) {
      errors.contact_number = 'Contact number is required.';
    }

    const score = parseInt(formData.safety_score);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.safety_score = 'Safety score must be an integer between 0 and 100.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // 2. Add driver & close modal
    const newDriverId = drivers.length + 1;
    const newDriver: MockDriver = {
      id: newDriverId,
      name: formData.name.trim(),
      license_expiry: formData.license_expiry_date.trim(),
      safety_score: score,
      status: formData.status as any,
    };

    // Inject temporary license number for mock records
    (newDriver as any).license_number = formData.license_number.toUpperCase().trim();
    (newDriver as any).license_category = formData.license_category;
    (newDriver as any).contact_number = formData.contact_number.trim();

    setDrivers([...drivers, newDriver]);
    setIsModalOpen(false);
    setNotification({
      type: 'success',
      message: `Driver ${newDriver.name} registered successfully in the pool.`,
    });
  };

  // --- COMPLIANCE TOGGLE BUTTONS ---
  const handleToggleDriverStatus = (id: number) => {
    setDrivers(
      drivers.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'Suspended' ? 'Available' : 'Suspended';
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  const handleDeleteDriver = (id: number) => {
    setDrivers(drivers.filter((d) => d.id !== id));
  };

  // --- FILTERS LOGIC ---
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((d as any).license_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;

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

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{DRIVER_PAGE_TITLES.header}</h2>
          <p className="text-sm text-gray-500 mt-1">{DRIVER_PAGE_TITLES.description}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          {DRIVER_PAGE_TITLES.registerButton}
        </Button>
      </div>

      {/* Roster Table */}
      <Card
        title={DRIVER_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={DRIVER_PAGE_TITLES.searchPlaceholder}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none focus:border-indigo-500 bg-white w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none bg-white"
            >
              <option value="">All Statuses</option>
              {DRIVER_STATUSES.map((s) => (
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
                {DRIVER_TABLE_HEADERS.map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDrivers.map((d) => (
                <tr key={d.id} className="text-gray-700">
                  <td className="py-3 font-semibold">#{d.id}</td>
                  <td className="py-3 font-semibold">{d.name}</td>
                  <td className="py-3">{(d as any).license_number || 'DL-TX-992014'}</td>
                  <td className="py-3">{(d as any).license_category || 'Class A CDL'}</td>
                  <td className="py-3">{d.license_expiry}</td>
                  <td className="py-3">{(d as any).contact_number || '+1-555-0103'}</td>
                  <td className="py-3">
                    <span
                      className={`font-bold ${
                        d.safety_score >= 90
                          ? 'text-green-600'
                          : d.safety_score >= 75
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {d.safety_score} / 100
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge
                      color={
                        d.status === 'Available'
                          ? 'success'
                          : d.status === 'On Trip'
                          ? 'info'
                          : d.status === 'Suspended'
                          ? 'error'
                          : 'gray'
                      }
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right flex justify-end gap-2">
                    <Button
                      variant={d.status === 'Suspended' ? 'success' : 'danger'}
                      size="sm"
                      onClick={() => handleToggleDriverStatus(d.id)}
                    >
                      {d.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteDriver(d.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}

              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={DRIVER_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No drivers found matching the search query or status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Centralized Registration Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={DRIVER_PAGE_TITLES.formTitle}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">{DRIVER_PAGE_TITLES.formSubtitle}</p>
        </div>
        <DynamicForm
          schema={DRIVER_FORM_SCHEMA}
          onSubmit={handleFormSubmit}
          submitLabel="Register Driver Profile"
          errors={formErrors}
        />
      </Modal>
    </div>
  );
}
