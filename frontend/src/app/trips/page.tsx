'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  MockVehicle,
  MockDriver,
  MockTrip
} from '../../constants/dashboardContent';
import {
  TRIP_PAGE_TITLES,
  TRIP_TABLE_HEADERS,
  TRIP_STATUSES
} from '../../constants/tripContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm, { FormFieldSchema } from '../../components/ui/DynamicForm';

export default function TripManagementPage() {
  const { user } = useAuth();
  const isOperator = user?.role === 'Fleet Manager' || user?.role === 'Driver'; // Safety Officer is view-only

  // Core states
  const [vehicles, setVehicles] = useState<MockVehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<MockDriver[]>(INITIAL_DRIVERS);
  const [trips, setTrips] = useState<MockTrip[]>(INITIAL_TRIPS);

  // Dialog toggles
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [activeCompleteTripId, setActiveCompleteTripId] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notifications
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- DYNAMIC SCHEMAS FOR MODALS ---
  const getDispatchSchema = (): FormFieldSchema[] => {
    const availableVehicles = vehicles.filter((v) => v.status === 'Available');
    const availableDrivers = drivers.filter((d) => d.status === 'Available');

    return [
      { name: 'source', label: 'Departure Location (Source)', type: 'text', placeholder: 'e.g. Warehouse East', required: true },
      { name: 'destination', label: 'Arrival Location (Destination)', type: 'text', placeholder: 'e.g. Retail Hub A', required: true },
      {
        name: 'vehicle_reg',
        label: 'Select Available Vehicle',
        type: 'select',
        options: availableVehicles.map((v) => ({
          value: v.registration_number,
          label: `${v.registration_number} (${v.model} - Max: ${v.max_capacity}kg)`,
        })),
        required: true,
      },
      {
        name: 'driver_id',
        label: 'Assign Available Driver',
        type: 'select',
        options: availableDrivers.map((d) => ({
          value: d.id,
          label: `${d.name} (Safety Score: ${d.safety_score})`,
        })),
        required: true,
      },
      { name: 'cargo_weight', label: 'Cargo Weight (kg)', type: 'number', placeholder: 'e.g. 500', required: true },
      { name: 'planned_distance', label: 'Planned Route Distance (km)', type: 'number', placeholder: 'e.g. 150', required: true },
    ];
  };

  const TRIP_COMPLETE_SCHEMA: FormFieldSchema[] = [
    { name: 'final_odometer', label: 'Final Odometer Reading (km)', type: 'number', placeholder: 'e.g. 12500', required: true },
    { name: 'fuel_consumed', label: 'Fuel Consumed (liters)', type: 'number', placeholder: 'e.g. 45', required: true },
  ];

  // --- ACTIONS & DISPATCH/COMPLETE VALIDATION ---
  
  const handleDispatchSubmit = (formData: Record<string, string>) => {
    if (!isOperator) return;
    setFormErrors({});
    setNotification(null);
    const errors: Record<string, string> = {};

    const cargo = parseFloat(formData.cargo_weight);
    if (isNaN(cargo) || cargo <= 0) {
      errors.cargo_weight = 'Cargo weight must be a positive number.';
    }

    const distance = parseFloat(formData.planned_distance);
    if (isNaN(distance) || distance <= 0) {
      errors.planned_distance = 'Distance must be a positive number.';
    }

    const driverId = parseInt(formData.driver_id);
    const vehicleReg = formData.vehicle_reg;

    const vehicle = vehicles.find((v) => v.registration_number === vehicleReg);
    const driver = drivers.find((d) => d.id === driverId);

    if (!vehicle) {
      errors.vehicle_reg = 'Please select a valid vehicle.';
    }
    if (!driver) {
      errors.driver_id = 'Please assign a driver.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (vehicle!.status !== 'Available') {
      errors.vehicle_reg = `Vehicle ${vehicle!.registration_number} is not Available.`;
    }
    if (driver!.status !== 'Available') {
      errors.driver_id = `Driver ${driver!.name} is not Available.`;
    }

    const expiry = new Date(driver!.license_expiry);
    const current = new Date();
    if (expiry < current) {
      errors.driver_id = `Driver license is expired (Expired: ${driver!.license_expiry}).`;
    }

    if (cargo > vehicle!.max_capacity) {
      errors.cargo_weight = `Cargo (${cargo}kg) exceeds vehicle capacity limit (${vehicle!.max_capacity}kg).`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newTripId = trips.length + 101;
    const addedTrip: MockTrip = {
      id: newTripId,
      source: formData.source.trim(),
      destination: formData.destination.trim(),
      vehicle_reg: vehicle!.registration_number,
      driver_name: driver!.name,
      cargo_weight: cargo,
      planned_distance: distance,
      status: 'Dispatched',
    };

    setTrips([addedTrip, ...trips]);
    setVehicles(
      vehicles.map((v) =>
        v.registration_number === vehicle!.registration_number ? { ...v, status: 'On Trip' } : v
      )
    );
    setDrivers(drivers.map((d) => (d.id === driver!.id ? { ...d, status: 'On Trip' } : d)));

    setIsDispatchModalOpen(false);
    setNotification({
      type: 'success',
      message: `Trip #${newTripId} successfully dispatched! Assets flagged as On Trip.`,
    });
  };

  const handleCompleteSubmit = (formData: Record<string, string>) => {
    if (!isOperator) return;
    setFormErrors({});
    setNotification(null);
    const errors: Record<string, string> = {};

    const finalOdo = parseFloat(formData.final_odometer);
    if (isNaN(finalOdo) || finalOdo <= 0) {
      errors.final_odometer = 'Odometer reading must be a positive number.';
    }

    const fuel = parseFloat(formData.fuel_consumed);
    if (isNaN(fuel) || fuel < 0) {
      errors.fuel_consumed = 'Fuel consumed cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const targetTrip = trips.find((t) => t.id === activeCompleteTripId);
    if (!targetTrip) return;

    const vehicle = vehicles.find((v) => v.registration_number === targetTrip.vehicle_reg);
    if (vehicle && finalOdo <= vehicle.odometer) {
      errors.final_odometer = `Final odometer must be higher than current departure reading (${vehicle.odometer} km).`;
      setFormErrors(errors);
      return;
    }

    setTrips(
      trips.map((t) =>
        t.id === activeCompleteTripId
          ? { ...t, status: 'Completed', final_odometer: finalOdo, fuel_consumed: fuel }
          : t
      )
    );
    setVehicles(
      vehicles.map((v) =>
        v.registration_number === targetTrip.vehicle_reg
          ? { ...v, status: 'Available', odometer: finalOdo }
          : v
      )
    );
    setDrivers(drivers.map((d) => (d.name === targetTrip.driver_name ? { ...d, status: 'Available' } : d)));

    setActiveCompleteTripId(null);
    setNotification({
      type: 'success',
      message: `Trip #${targetTrip.id} successfully completed. Vehicle odometer updated.`,
    });
  };

  const handleCancelTrip = (tripId: number) => {
    if (!isOperator) return;
    const target = trips.find((t) => t.id === tripId);
    if (!target) return;

    setTrips(trips.map((t) => (t.id === tripId ? { ...t, status: 'Cancelled' } : t)));
    setVehicles(
      vehicles.map((v) =>
        v.registration_number === target.vehicle_reg ? { ...v, status: 'Available' } : v
      )
    );
    setDrivers(drivers.map((d) => (d.name === target.driver_name ? { ...d, status: 'Available' } : d)));

    setNotification({
      type: 'success',
      message: `Trip #${tripId} has been Cancelled. Resources reset to Available.`,
    });
  };

  // --- FILTERS ---
  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans text-gray-950 pb-12">
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

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 p-6 rounded-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{TRIP_PAGE_TITLES.header}</h2>
          <p className="text-sm text-gray-500 mt-1">{TRIP_PAGE_TITLES.description}</p>
        </div>
        {/* Only operators can Dispatch new routes */}
        {isOperator && (
          <Button onClick={() => { setFormErrors({}); setIsDispatchModalOpen(true); }}>
            {TRIP_PAGE_TITLES.dispatchButton}
          </Button>
        )}
      </div>

      {/* Roster Table */}
      <Card
        title={TRIP_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={TRIP_PAGE_TITLES.searchPlaceholder}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none focus:border-indigo-500 bg-white w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none bg-white"
            >
              <option value="">All Statuses</option>
              {TRIP_STATUSES.map((s) => (
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
                {TRIP_TABLE_HEADERS.filter((h) => h !== 'Actions' || isOperator).map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTrips.map((t) => (
                <tr key={t.id} className="text-gray-700">
                  <td className="py-3 font-semibold">#{t.id}</td>
                  <td className="py-3">
                    <div className="font-semibold text-gray-900">{t.destination}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">From: {t.source}</div>
                  </td>
                  <td className="py-3 font-mono text-xs">{t.vehicle_reg}</td>
                  <td className="py-3 font-semibold">{t.driver_name}</td>
                  <td className="py-3">{t.cargo_weight} kg</td>
                  <td className="py-3">{t.planned_distance} km</td>
                  <td className="py-3">{t.fuel_consumed != null ? `${t.fuel_consumed} L` : '-'}</td>
                  <td className="py-3">{t.final_odometer != null ? `${t.final_odometer} km` : '-'}</td>
                  <td className="py-3">
                    <Badge
                      color={
                        t.status === 'Completed'
                          ? 'success'
                          : t.status === 'Dispatched'
                          ? 'info'
                          : t.status === 'Cancelled'
                          ? 'error'
                          : 'gray'
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                  {/* Hide row action buttons for view-only roles */}
                  {isOperator && (
                    <td className="py-3 text-right flex justify-end gap-2">
                      {t.status === 'Dispatched' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setFormErrors({});
                              setActiveCompleteTripId(t.id);
                            }}
                          >
                            Complete
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleCancelTrip(t.id)}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={TRIP_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No routes or dispatches found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dispatch Modal */}
      {isOperator && (
        <Modal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          title={TRIP_PAGE_TITLES.formTitle}
        >
          <div className="mb-4">
            <p className="text-sm text-gray-500">{TRIP_PAGE_TITLES.formSubtitle}</p>
          </div>
          <DynamicForm
            schema={getDispatchSchema()}
            onSubmit={handleDispatchSubmit}
            submitLabel="Dispatch Route"
            errors={formErrors}
          />
        </Modal>
      )}

      {/* Complete Modal */}
      {isOperator && (
        <Modal
          isOpen={activeCompleteTripId !== null}
          onClose={() => setActiveCompleteTripId(null)}
          title={TRIP_PAGE_TITLES.completeTitle}
        >
          <div className="mb-4">
            <p className="text-sm text-gray-500">{TRIP_PAGE_TITLES.completeSubtitle}</p>
          </div>
          <DynamicForm
            schema={TRIP_COMPLETE_SCHEMA}
            onSubmit={handleCompleteSubmit}
            submitLabel="Complete Trip & Record Logs"
            errors={formErrors}
          />
        </Modal>
      )}
    </div>
  );
}
