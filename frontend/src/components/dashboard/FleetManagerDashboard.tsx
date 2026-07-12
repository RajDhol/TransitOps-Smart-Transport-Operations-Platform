'use client';

import React, { useState } from 'react';
import { MockVehicle, MockDriver, TABLE_HEADERS } from '../../constants/dashboardContent';
import { VEHICLE_PAGE_TITLES, VEHICLE_FORM_SCHEMA } from '../../constants/vehicleContent';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DynamicForm from '../ui/DynamicForm';

interface FleetManagerDashboardProps {
  vehicles: MockVehicle[];
  drivers: MockDriver[];
  onRegisterVehicle: (newVehicle: MockVehicle) => void;
}

export default function FleetManagerDashboard({
  vehicles,
  drivers,
  onRegisterVehicle,
}: FleetManagerDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const stats = [
    { label: 'Total Vehicles', value: vehicles.length },
    { label: 'In Shop (Maintenance)', value: vehicles.filter((v) => v.status === 'In Shop').length, color: 'text-amber-600' },
    { label: 'Available Drivers', value: drivers.filter((d) => d.status === 'Available').length, color: 'text-green-600' },
    { label: 'Fleet Utilization', value: '66.7%', color: 'text-indigo-600' },
  ];

  const handleFormSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    const errors: Record<string, string> = {};

    // Validations
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

    // Call registration parent callback
    const newVehicle: MockVehicle = {
      registration_number: formData.registration_number.toUpperCase().trim(),
      model: formData.model.trim(),
      type: formData.type,
      max_capacity: capacity,
      odometer: odo,
      status: formData.status as any,
      region: formData.region,
    };

    onRegisterVehicle(newVehicle);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 p-6 rounded-md flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{stat.label}</span>
            <span className={`text-3xl font-black mt-2 text-gray-900 ${stat.color || ''}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table summary */}
        <Card className="lg:col-span-2" title="Vehicle Registry Summary">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                  {TABLE_HEADERS.vehicles.map((header) => (
                    <th key={header} className="pb-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <tr key={v.registration_number} className="text-gray-700">
                    <td className="py-3 font-semibold">{v.registration_number}</td>
                    <td className="py-3">{v.model}</td>
                    <td className="py-3">{v.type}</td>
                    <td className="py-3">{v.max_capacity} kg</td>
                    <td className="py-3">{v.odometer} km</td>
                    <td className="py-3">{v.region}</td>
                    <td className="py-3">
                      <Badge
                        color={
                          v.status === 'Available' ? 'success' :
                          v.status === 'On Trip' ? 'info' :
                          v.status === 'In Shop' ? 'warning' : 'gray'
                        }
                      >
                        {v.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Action shortcut panel */}
        <Card title="Quick Actions" subtitle="Perform fleet registry operations.">
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(true)} fullWidth>
              + Register New Vehicle
            </Button>
            <Button variant="outline" fullWidth>+ Add New Driver</Button>
            <Button variant="outline" fullWidth>+ Log Maintenance Ticket</Button>
          </div>
        </Card>
      </div>

      {/* Centralized Registration Modal */}
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
    </div>
  );
}
