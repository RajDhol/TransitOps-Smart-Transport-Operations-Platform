'use client';

import React, { useState } from 'react';
import { INITIAL_DRIVERS, MockDriver } from '../../constants/dashboardContent';
import {
  DRIVER_PAGE_TITLES,
  LICENSE_CATEGORIES,
  DRIVER_TABLE_HEADERS,
  DRIVER_FORM_SCHEMA
} from '../../constants/driverContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';

export default function DriverManagementPage() {
  // Mock drivers database state
  const [drivers, setDrivers] = useState<MockDriver[]>(INITIAL_DRIVERS);
  
  // UI Dialog toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- FORM SUBMIT & COMPLIANCE VALIDATIONS ---
  const handleFormSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    setNotification(null);

    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Driver full name is required.';
    }

    if (!formData.license_number?.trim()) {
      errors.license_number = 'License number is required.';
    } else {
      const exists = drivers.some(
        (d) => d.license_number?.toLowerCase() === formData.license_number.trim().toLowerCase()
      );
      if (exists) {
        errors.license_number = 'This license number is already registered.';
      }
    }

    if (!formData.license_expiry) {
      errors.license_expiry = 'License expiry date is required.';
    }

    const score = parseInt(formData.safety_score);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.safety_score = 'Safety score must be an integer between 0 and 100.';
    }

    if (!formData.contact_number?.trim()) {
      errors.contact_number = 'Contact phone number is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newDriver: MockDriver = {
      id: drivers.length + 1,
      name: formData.name.trim(),
      license_number: formData.license_number.toUpperCase().trim(),
      license_category: formData.license_category,
      license_expiry: formData.license_expiry,
      contact_number: formData.contact_number.trim(),
      safety_score: score,
      status: formData.status as any,
    };

    setDrivers([newDriver, ...drivers]);
    setIsModalOpen(false);
    setNotification({
      type: 'success',
      message: `Driver profile for ${newDriver.name} added successfully. Compliance rules initialized.`,
    });
  };

  const handleSuspendDriver = (id: number) => {
    setDrivers(
      drivers.map((d) => (d.id === id ? { ...d, status: 'Suspended' } : d))
    );
  };

  const handleActivateDriver = (id: number) => {
    setDrivers(
      drivers.map((d) => (d.id === id ? { ...d, status: 'Available' } : d))
    );
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.license_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;

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

      {/* Roster Table */}
      <Card
        title={DRIVER_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            {/* Added trigger button directly inside table card actions */}
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              {DRIVER_PAGE_TITLES.registerButton}
            </Button>
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
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
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
                  <td className="py-3 font-semibold text-gray-905">{d.name}</td>
                  <td className="py-3 font-mono text-xs">{d.license_number || '—'}</td>
                  <td className="py-3">{d.license_category || 'Class B CDL'}</td>
                  <td className="py-3 font-medium">{d.license_expiry}</td>
                  <td className="py-3 text-xs">{d.contact_number || '—'}</td>
                  <td className="py-3">
                    <span
                      className={`font-semibold ${
                        d.safety_score >= 85
                          ? 'text-green-600'
                          : d.safety_score >= 70
                          ? 'text-amber-500'
                          : 'text-red-500'
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
                          : d.status === 'Off Duty'
                          ? 'gray'
                          : 'error'
                      }
                    >
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right flex justify-end gap-2">
                    {d.status !== 'Suspended' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspendDriver(d.id)}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleActivateDriver(d.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={DRIVER_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No drivers found matching search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Dialog */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={DRIVER_PAGE_TITLES.formTitle}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">{DRIVER_PAGE_TITLES.formSubtitle}</p>
        </div>
        <DynamicForm
          schema={DRIVER_FORM_SCHEMA}
          onSubmit={handleFormSubmit}
          submitLabel="Save Driver Profile"
          errors={formErrors}
        />
      </Modal>
    </div>
  );
}
