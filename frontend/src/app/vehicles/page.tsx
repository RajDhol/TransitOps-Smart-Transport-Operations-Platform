'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_VEHICLES, MockVehicle } from '../../constants/dashboardContent';
import {
  VEHICLE_PAGE_TITLES,
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
  VEHICLE_TABLE_HEADERS,
  VEHICLE_FORM_SCHEMA
} from '../../constants/vehicleContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm from '../../components/ui/DynamicForm';

export default function VehicleRegistryPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'Fleet Manager';

  // Mock vehicles roster state
  const [vehicles, setVehicles] = useState<MockVehicle[]>(INITIAL_VEHICLES);
  
  // UI Dialog toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- FORM SUBMIT & DYNAMIC VALIDATION ---
  const handleFormSubmit = (formData: Record<string, string>) => {
    if (!isManager) return;
    setFormErrors({});
    setNotification(null);

    const errors: Record<string, string> = {};

    if (!formData.registration_number?.trim()) {
      errors.registration_number = 'Registration number is required.';
    } else {
      const exists = vehicles.some(
        (v) => v.registration_number.toLowerCase() === formData.registration_number.trim().toLowerCase()
      );
      if (exists) {
        errors.registration_number = 'This registration number is already registered.';
      }
    }

    if (!formData.model?.trim()) {
      errors.model = 'Vehicle model name is required.';
    }

    const capacity = parseFloat(formData.max_capacity);
    if (isNaN(capacity) || capacity <= 0) {
      errors.max_capacity = 'Max capacity must be a positive number.';
    }

    const odo = parseFloat(formData.odometer);
    if (isNaN(odo) || odo < 0) {
      errors.odometer = 'Odometer reading cannot be negative.';
    }

    const cost = parseFloat(formData.acquisition_cost);
    if (isNaN(cost) || cost <= 0) {
      errors.acquisition_cost = 'Acquisition cost must be positive.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newVehicle: MockVehicle = {
      registration_number: formData.registration_number.toUpperCase().trim(),
      model: formData.model.trim(),
      type: formData.type,
      max_capacity: capacity,
      odometer: odo,
      status: formData.status as any,
      region: formData.region,
    };

    setVehicles([newVehicle, ...vehicles]);
    setIsModalOpen(false);
    setNotification({
      type: 'success',
      message: `Vehicle ${newVehicle.registration_number} registered successfully in the fleet.`,
    });
  };

  const handleRetireVehicle = (regNo: string) => {
    if (!isManager) return;
    setVehicles(
      vehicles.map((v) => (v.registration_number === regNo ? { ...v, status: 'Retired' } : v))
    );
  };

  const handleDeleteVehicle = (regNo: string) => {
    if (!isManager) return;
    setVehicles(vehicles.filter((v) => v.registration_number !== regNo));
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || v.type === typeFilter;
    const matchesStatus = !statusFilter || v.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
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

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{VEHICLE_PAGE_TITLES.header}</h2>
          <p className="text-sm text-gray-500 mt-1">{VEHICLE_PAGE_TITLES.description}</p>
        </div>
        {/* Only show Register button to Fleet Managers */}
        {isManager && (
          <Button onClick={() => setIsModalOpen(true)}>
            {VEHICLE_PAGE_TITLES.registerButton}
          </Button>
        )}
      </div>

      {/* Roster list */}
      <Card
        title={VEHICLE_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={VEHICLE_PAGE_TITLES.searchPlaceholder}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none focus:border-indigo-500 bg-white w-full sm:w-64"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none bg-white"
            >
              <option value="">All Types</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none bg-white"
            >
              <option value="">All Statuses</option>
              {VEHICLE_STATUSES.map((s) => (
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
                {/* Dynamically strip Actions header if not Manager */}
                {VEHICLE_TABLE_HEADERS.filter((h) => h !== 'Actions' || isManager).map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVehicles.map((v) => (
                <tr key={v.registration_number} className="text-gray-700">
                  <td className="py-3 font-semibold">{v.registration_number}</td>
                  <td className="py-3">{v.model}</td>
                  <td className="py-3">{v.type}</td>
                  <td className="py-3">{v.max_capacity} kg</td>
                  <td className="py-3">{v.odometer} km</td>
                  <td className="py-3">$25,000.00</td>
                  <td className="py-3">
                    <Badge color="gray">{v.region}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge
                      color={
                        v.status === 'Available'
                          ? 'success'
                          : v.status === 'On Trip'
                          ? 'info'
                          : v.status === 'In Shop'
                          ? 'warning'
                          : 'gray'
                      }
                    >
                      {v.status}
                    </Badge>
                  </td>
                  {/* Hide row action buttons for view-only roles */}
                  {isManager && (
                    <td className="py-3 text-right flex justify-end gap-2">
                      {v.status !== 'Retired' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetireVehicle(v.registration_number)}
                        >
                          Retire
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteVehicle(v.registration_number)}
                      >
                        Delete
                      </Button>
                    </td>
                  )}
                </tr>
              ))}

              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={VEHICLE_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No vehicles found matching the search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Registration Modal (Only loadable for Manager) */}
      {isManager && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={VEHICLE_PAGE_TITLES.formTitle}>
          <div className="mb-4">
            <p className="text-sm text-gray-500">{VEHICLE_PAGE_TITLES.formSubtitle}</p>
          </div>
          <DynamicForm
            schema={VEHICLE_FORM_SCHEMA}
            onSubmit={handleFormSubmit}
            submitLabel="Save Vehicle to Fleet"
            errors={formErrors}
          />
        </Modal>
      )}
    </div>
  );
}
