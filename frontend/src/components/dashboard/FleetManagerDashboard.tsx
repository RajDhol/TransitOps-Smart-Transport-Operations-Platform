'use client';

import React, { useState, useEffect } from 'react';
import { MockVehicle, MockDriver, TABLE_HEADERS } from '../../constants/dashboardContent';
import { VEHICLE_PAGE_TITLES, VEHICLE_FORM_SCHEMA } from '../../constants/vehicleContent';
import { DRIVER_PAGE_TITLES, DRIVER_FORM_SCHEMA } from '../../constants/driverContent';
import { DashboardStats } from '../../services/authService';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DynamicForm, { FormFieldSchema } from '../ui/DynamicForm';
import Pagination from '../ui/Pagination';

interface FleetManagerDashboardProps {
  vehicles: MockVehicle[];
  drivers: MockDriver[];
  onRegisterVehicle: (newVehicle: MockVehicle) => void;
  onRegisterDriver: (newDriver: MockDriver) => void;
  stats?: DashboardStats | null;
}

export default function FleetManagerDashboard({
  vehicles,
  drivers,
  onRegisterVehicle,
  onRegisterDriver,
  stats: statsProps,
}: FleetManagerDashboardProps) {
  // Modal states: 'vehicle' | 'driver' | 'maintenance' | null
  const [activeForm, setActiveForm] = useState<'vehicle' | 'driver' | 'maintenance' | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Pagination State for Vehicles
  const [vehiclePage, setVehiclePage] = useState(1);
  const VEHICLES_PER_PAGE = 5;

  const totalPages = Math.ceil(vehicles.length / VEHICLES_PER_PAGE);
  const paginatedVehicles = vehicles.slice(
    (vehiclePage - 1) * VEHICLES_PER_PAGE,
    vehiclePage * VEHICLES_PER_PAGE
  );

  useEffect(() => {
    setVehiclePage(1);
  }, [vehicles.length]);

  const stats = [
    { label: 'Total Vehicles', value: statsProps ? statsProps.total_vehicles : vehicles.length },
    { label: 'In Shop (Maintenance)', value: statsProps ? statsProps.vehicles_in_shop : vehicles.filter((v) => v.status === 'In Shop').length, color: 'text-amber-600' },
    { label: 'Available Drivers', value: statsProps ? statsProps.available_drivers : drivers.filter((d) => d.status === 'Available').length, color: 'text-green-600' },
    { label: 'Fleet Utilization', value: statsProps ? `${statsProps.fleet_utilization_percentage}%` : '66.7%', color: 'text-indigo-600' },
  ];

  // Dynamic Maintenance Schema
  const MAINTENANCE_FORM_SCHEMA: FormFieldSchema[] = [
    {
      name: 'vehicle_reg',
      label: 'Select Vehicle',
      type: 'select',
      options: vehicles.map(v => ({ value: v.registration_number, label: `${v.registration_number} (${v.model})` })),
      required: true,
    },
    {
      name: 'service_date',
      label: 'Service Date (YYYY-MM-DD)',
      type: 'text',
      placeholder: 'e.g. 2026-07-12',
      required: true,
    },
    {
      name: 'description',
      label: 'Description / Repair Details',
      type: 'text',
      placeholder: 'e.g. Brake pad inspection & oil swap',
      required: true,
    },
    {
      name: 'cost',
      label: 'Service Cost ($)',
      type: 'number',
      placeholder: '150.00',
      required: true,
    },
  ];

  const handleFormSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    const errors: Record<string, string> = {};

    if (activeForm === 'vehicle') {
      // 1. Vehicle validation checks
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

      onRegisterVehicle({
        registration_number: formData.registration_number.toUpperCase().trim(),
        model: formData.model.trim(),
        type: formData.type,
        max_capacity: capacity,
        odometer: odo,
        status: formData.status as any,
        region: formData.region,
        acquisition_cost: cost,
      } as any);

    } else if (activeForm === 'driver') {
      // 2. Driver validation checks
      if (!formData.name?.trim()) {
        errors.name = 'Driver name is required.';
      }

      if (!formData.license_number?.trim()) {
        errors.license_number = 'License number is required.';
      } else {
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
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.license_expiry_date.trim())) {
          errors.license_expiry_date = 'Expiry date must be in YYYY-MM-DD format.';
        }
      }

      const score = parseInt(formData.safety_score);
      if (isNaN(score) || score < 0 || score > 100) {
        errors.safety_score = 'Safety score must be between 0 and 100.';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      onRegisterDriver({
        id: drivers.length + 1,
        name: formData.name.trim(),
        license_expiry: formData.license_expiry_date.trim(),
        safety_score: score,
        status: formData.status as any,
        license_number: formData.license_number.toUpperCase().trim(),
        license_category: formData.license_category,
        contact_number: formData.contact_number,
      });

    } else if (activeForm === 'maintenance') {
      // 3. Maintenance ticket validations
      if (!formData.vehicle_reg) {
        errors.vehicle_reg = 'Please select a vehicle.';
      }
      if (!formData.service_date?.trim()) {
        errors.service_date = 'Service date is required.';
      }
      const cost = parseFloat(formData.cost);
      if (isNaN(cost) || cost < 0) {
        errors.cost = 'Cost cannot be negative.';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      // Automatically change vehicle status to In Shop
      const targetVehicle = vehicles.find(v => v.registration_number === formData.vehicle_reg);
      if (targetVehicle) {
        targetVehicle.status = 'In Shop';
        onRegisterVehicle({ ...targetVehicle });
      }
    }

    setActiveForm(null);
  };

  const getFormSchema = () => {
    switch (activeForm) {
      case 'vehicle': return VEHICLE_FORM_SCHEMA;
      case 'driver': return DRIVER_FORM_SCHEMA;
      case 'maintenance': return MAINTENANCE_FORM_SCHEMA;
      default: return [];
    }
  };

  const getModalTitle = () => {
    switch (activeForm) {
      case 'vehicle': return VEHICLE_PAGE_TITLES.formTitle;
      case 'driver': return DRIVER_PAGE_TITLES.formTitle;
      case 'maintenance': return 'Log Maintenance Ticket';
      default: return '';
    }
  };

  const getModalSubtitle = () => {
    switch (activeForm) {
      case 'vehicle': return VEHICLE_PAGE_TITLES.formSubtitle;
      case 'driver': return DRIVER_PAGE_TITLES.formSubtitle;
      case 'maintenance': return 'Flag vehicle under service ticket. Status sets to In Shop.';
      default: return '';
    }
  };

  const getSubmitLabel = () => {
    switch (activeForm) {
      case 'vehicle': return 'Save Vehicle to Fleet';
      case 'driver': return 'Register Driver Profile';
      case 'maintenance': return 'Submit Ticket';
      default: return 'Submit';
    }
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
                {paginatedVehicles.map((v) => (
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
          <Pagination
            currentPage={vehiclePage}
            totalPages={totalPages}
            onPageChange={setVehiclePage}
            totalItems={vehicles.length}
            itemsPerPage={VEHICLES_PER_PAGE}
          />
        </Card>

        {/* Action shortcut panel */}
        <Card title="Quick Actions" subtitle="Perform fleet registry operations.">
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => { setFormErrors({}); setActiveForm('vehicle'); }} fullWidth>
              + Register New Vehicle
            </Button>
            <Button variant="outline" onClick={() => { setFormErrors({}); setActiveForm('driver'); }} fullWidth>
              + Add New Driver
            </Button>
            <Button variant="outline" onClick={() => { setFormErrors({}); setActiveForm('maintenance'); }} fullWidth>
              + Log Maintenance Ticket
            </Button>
          </div>
        </Card>
      </div>

      {/* Dynamic Centralized Modal */}
      <Modal isOpen={activeForm !== null} onClose={() => setActiveForm(null)} title={getModalTitle()}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">{getModalSubtitle()}</p>
        </div>
        <DynamicForm
          schema={getFormSchema()}
          onSubmit={handleFormSubmit}
          submitLabel={getSubmitLabel()}
          errors={formErrors}
        />
      </Modal>
    </div>
  );
}
