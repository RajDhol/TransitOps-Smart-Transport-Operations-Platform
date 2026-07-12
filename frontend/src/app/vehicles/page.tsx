'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
import Pagination from '../../components/ui/Pagination';

interface Vehicle {
  registration_number: string;
  model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
}

export default function VehicleRegistryPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'Fleet Manager';

  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currencyCode, setCurrencyCode] = useState('INR (Rs)');
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // UI Dialog toggles
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- API DATA FETCH ---
  const fetchFleetData = async () => {
    try {
      const [vRes, sRes] = await Promise.all([
        fetch('http://localhost:8000/api/vehicles'),
        fetch('http://localhost:8000/api/settings')
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(vData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setCurrencyCode(sData.currency || 'INR (Rs)');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to synchronize vehicles registry with server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  // Reset page number when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  // --- FORM SUBMIT & DYNAMIC VALIDATION ---
  const handleFormSubmit = async (formData: Record<string, string>) => {
    if (!isManager) return;
    setFormErrors({});
    setNotification(null);

    const errors: Record<string, string> = {};

    if (!formData.registration_number?.trim()) {
      errors.registration_number = 'Registration number is required.';
    }

    if (!formData.model?.trim()) {
      errors.model = 'Vehicle model name is required.';
    }

    const capacity = parseFloat(formData.max_load_capacity);
    if (isNaN(capacity) || capacity <= 0) {
      errors.max_load_capacity = 'Max capacity must be a positive number.';
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

    try {
      const suffix = `-${formData.region.toUpperCase()}`;
      const regNo = formData.registration_number.toUpperCase().trim();
      const formattedRegNo = regNo.endsWith(suffix) ? regNo : `${regNo}${suffix}`;

      const res = await fetch('http://localhost:8000/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: formattedRegNo,
          model: formData.model.trim(),
          type: formData.type,
          max_load_capacity: capacity,
          odometer: odo,
          acquisition_cost: cost,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.detail && data.detail.includes('unique')) {
          setFormErrors({ registration_number: 'This vehicle registration number is already registered.' });
          return;
        }
        throw new Error(data.detail || 'Registration failed.');
      }

      setNotification({
        type: 'success',
        message: `Vehicle ${formData.registration_number.toUpperCase().trim()} registered successfully.`,
      });
      setIsModalOpen(false);
      fetchFleetData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleRetireVehicle = async (regNo: string) => {
    if (!isManager) return;
    setNotification(null);
    try {
      const res = await fetch(`http://localhost:8000/api/vehicles/${regNo}/retire`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to retire vehicle.');
      }
      setNotification({
        type: 'success',
        message: `Vehicle ${regNo} retired successfully from active dispatch pool.`,
      });
      fetchFleetData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteVehicle = async (regNo: string) => {
    if (!isManager) return;
    setNotification(null);
    try {
      const res = await fetch(`http://localhost:8000/api/vehicles/${regNo}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to delete vehicle.');
      }
      setNotification({
        type: 'success',
        message: `Vehicle ${regNo} deleted successfully from fleet registry.`,
      });
      fetchFleetData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || v.type === typeFilter;
    const matchesStatus = !statusFilter || v.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
        title={VEHICLE_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            {/* Action button placed inside card header actions */}
            {isManager && (
              <Button onClick={() => setIsModalOpen(true)} size="sm">
                {VEHICLE_PAGE_TITLES.registerButton}
              </Button>
            )}
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
                {VEHICLE_TABLE_HEADERS.filter((h) => h !== 'Actions' || isManager).map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={VEHICLE_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    Loading fleet data...
                  </td>
                </tr>
              ) : paginatedVehicles.map((v) => (
                <tr key={v.registration_number} className="text-gray-700">
                  <td className="py-3 font-semibold">{v.registration_number}</td>
                  <td className="py-3">{v.model}</td>
                  <td className="py-3">{v.type}</td>
                  <td className="py-3">{v.max_load_capacity.toLocaleString()} kg</td>
                  <td className="py-3">{v.odometer.toLocaleString()} km</td>
                  <td className="py-3 font-semibold">
                    {currencyCode.includes('INR') ? 'Rs. ' : '$'}
                    {v.acquisition_cost.toLocaleString()}
                  </td>
                  <td className="py-3">
                    {(() => {
                      const parts = v.registration_number.split('-');
                      return parts.length > 2 ? parts[parts.length - 1] : 'GJ';
                    })()}
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
                  {isManager && (
                    <td className="py-3 text-right flex justify-end gap-2">
                      {v.status !== 'Retired' && v.status !== 'On Trip' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetireVehicle(v.registration_number)}
                        >
                          Retire
                        </Button>
                      )}
                      {v.status !== 'On Trip' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteVehicle(v.registration_number)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!isLoading && filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={VEHICLE_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No vehicles found matching the search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredVehicles.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Card>

      {/* Registration Modal */}
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
