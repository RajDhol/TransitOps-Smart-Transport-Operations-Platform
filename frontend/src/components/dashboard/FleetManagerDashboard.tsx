'use client';

import React, { useState } from 'react';
import { MockVehicle, MockDriver, TABLE_HEADERS } from '../../constants/dashboardContent';
import { VEHICLE_PAGE_TITLES, VEHICLE_FORM_SCHEMA } from '../../constants/vehicleContent';
import { DRIVER_PAGE_TITLES, LICENSE_CATEGORIES } from '../../constants/driverContent';
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
  onRegisterVehicle: (newVehicle: any) => void;
  onRegisterDriver: (newDriver: any) => void;
  onLogMaintenance: (reg: string, date: string, cost: number, desc: string) => void;
  stats?: DashboardStats | null;
}

export default function FleetManagerDashboard({
  vehicles,
  drivers,
  onRegisterVehicle,
  onRegisterDriver,
  onLogMaintenance,
  stats: statsProps,
}: FleetManagerDashboardProps) {
  // Modal states: 'vehicle' | 'driver' | 'maintenance' | null
  const [activeForm, setActiveForm] = useState<'vehicle' | 'driver' | 'maintenance' | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Custom driver form state (matching drivers/page.tsx exactly)
  const [driverForm, setDriverForm] = useState({
    name: '',
    license_number: '',
    license_category: 'Class A CDL',
    license_expiry_date: '',
    contact_number: '',
    safety_score: '100'
  });

  // Pagination State for Vehicles
  const [vehiclePage, setVehiclePage] = useState(1);
  const VEHICLES_PER_PAGE = 5;

  const totalPages = Math.ceil(vehicles.length / VEHICLES_PER_PAGE);
  const paginatedVehicles = vehicles.slice(
    (vehiclePage - 1) * VEHICLES_PER_PAGE,
    vehiclePage * VEHICLES_PER_PAGE
  );

  const stats = [
    { label: 'Total Vehicles', value: statsProps ? statsProps.total_vehicles : vehicles.length },
    { label: 'In Shop (Maintenance)', value: statsProps ? statsProps.vehicles_in_shop : vehicles.filter((v) => v.status === 'In Shop').length, color: 'text-amber-600' },
    { label: 'Available Drivers', value: statsProps ? statsProps.available_drivers : drivers.filter((d) => d.status === 'Available').length, color: 'text-green-600' },
    { label: 'Fleet Utilization', value: statsProps ? `${statsProps.fleet_utilization_percentage}%` : '66.7%', color: 'text-indigo-600' },
  ];

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // --- Dynamic Maintenance Form Schema (matching maintenance/page.tsx exactly) ---
  const getMaintenanceSchema = (): FormFieldSchema[] => {
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

  // --- ACTIONS & SUBMIT VALIDATIONS FOR DYNAMIC FORMS ---
  const handleVehicleSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    const errors: Record<string, string> = {};

    if (!formData.registration_number?.trim()) {
      errors.registration_number = 'Registration number is required.';
    }

    if (!formData.model?.trim()) {
      errors.model = 'Model is required.';
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

    onRegisterVehicle({
      registration_number: formData.registration_number.toUpperCase().trim(),
      model: formData.model.trim(),
      type: formData.type,
      max_capacity: capacity,
      odometer: odo,
      acquisition_cost: cost,
      status: 'Available',
      region: 'GJ'
    });

    setActiveForm(null);
  };

  const handleMaintenanceSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    const errors: Record<string, string> = {};

    if (!formData.vehicle_reg) {
      errors.vehicle_reg = 'Please select a vehicle.';
    }
    if (!formData.service_date) {
      errors.service_date = 'Service date is required.';
    }
    const costVal = parseFloat(formData.cost);
    if (isNaN(costVal) || costVal < 0) {
      errors.cost = 'Cost cannot be negative.';
    }
    if (!formData.description?.trim()) {
      errors.description = 'Service description is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onLogMaintenance(
      formData.vehicle_reg,
      formData.service_date,
      costVal,
      formData.description.trim()
    );

    setActiveForm(null);
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const errors: Record<string, string> = {};

    const trimmedName = driverForm.name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 3) {
      errors.name = 'Name must be at least 3 characters long.';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      errors.name = 'Name can only contain letters and spaces.';
    }

    const trimmedLicense = driverForm.license_number.trim();
    if (!trimmedLicense) {
      errors.license_number = 'License number is required.';
    } else if (trimmedLicense.length < 5 || trimmedLicense.length > 25) {
      errors.license_number = 'License number must be between 5 and 25 characters.';
    } else if (!/^[A-Z0-9-\s]+$/i.test(trimmedLicense)) {
      errors.license_number = 'License number must be alphanumeric.';
    }

    const trimmedContact = driverForm.contact_number.trim();
    if (!trimmedContact) {
      errors.contact_number = 'Contact number is required.';
    } else if (!/^\+?[\d\s-]{10,15}$/.test(trimmedContact)) {
      errors.contact_number = 'Enter a valid phone number (10 to 15 digits).';
    }

    if (!driverForm.license_expiry_date) {
      errors.license_expiry_date = 'Expiry date is required.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(driverForm.license_expiry_date);
      if (expiry <= today) {
        errors.license_expiry_date = 'Expiry date must be in the future.';
      }
    }

    const score = parseInt(driverForm.safety_score);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.safety_score = 'Safety score must be between 0 and 100.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onRegisterDriver({
      name: trimmedName,
      license_number: trimmedLicense.toUpperCase(),
      license_category: driverForm.license_category,
      license_expiry: driverForm.license_expiry_date,
      contact_number: trimmedContact,
      safety_score: score,
      status: 'Available'
    });

    setDriverForm({
      name: '',
      license_number: '',
      license_category: 'Class A CDL',
      license_expiry_date: '',
      contact_number: '',
      safety_score: '100'
    });
    setActiveForm(null);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 p-6 rounded-md flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</span>
            <span className={`text-2xl font-black mt-2 text-gray-900 ${stat.color || ''}`}>{stat.value}</span>
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
                    <td className="py-3">{v.max_capacity?.toLocaleString()} kg</td>
                    <td className="py-3">{v.odometer?.toLocaleString()} km</td>
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

      {/* ── Vehicle Modal (using DynamicForm matching vehicles page exactly) ── */}
      <Modal isOpen={activeForm === 'vehicle'} onClose={() => setActiveForm(null)} title={VEHICLE_PAGE_TITLES.formTitle}>
        <div className="mb-4">
          <p className="text-sm text-gray-500">{VEHICLE_PAGE_TITLES.formSubtitle}</p>
        </div>
        <DynamicForm
          schema={VEHICLE_FORM_SCHEMA}
          onSubmit={handleVehicleSubmit}
          submitLabel="Save Vehicle to Fleet"
          errors={formErrors}
        />
      </Modal>

      {/* ── Driver Modal (using custom HTML form matching drivers page exactly) ── */}
      <Modal isOpen={activeForm === 'driver'} onClose={() => setActiveForm(null)} title={DRIVER_PAGE_TITLES.formTitle}>
        <p className="text-sm text-gray-500 mb-5">{DRIVER_PAGE_TITLES.formSubtitle}</p>
        <form onSubmit={handleDriverSubmit} className="space-y-4">
          
          {(['name', 'license_number', 'contact_number'] as const).map(field => (
            <div key={field} className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                {field.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={driverForm[field]}
                onChange={e => setDriverForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                placeholder={field === 'name' ? 'e.g. Rajesh Sharma' : field === 'license_number' ? 'e.g. GJ14 20230012345' : '+91 98765 43210'}
              />
              {formErrors[field] && <p className="text-xs text-red-500">{formErrors[field]}</p>}
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">License Category</label>
            <select
              value={driverForm.license_category}
              onChange={e => setDriverForm(f => ({ ...f, license_category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none bg-white"
            >
              {LICENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">License Expiry Date</label>
            <input
              type="date"
              min={getTodayString()}
              value={driverForm.license_expiry_date}
              onChange={e => setDriverForm(f => ({ ...f, license_expiry_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
            />
            {formErrors.license_expiry_date && <p className="text-xs text-red-500">{formErrors.license_expiry_date}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Initial Safety Score (0–100)</label>
            <input
              type="number"
              min={0} max={100}
              value={driverForm.safety_score}
              onChange={e => setDriverForm(f => ({ ...f, safety_score: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
            />
            {formErrors.safety_score && <p className="text-xs text-red-500">{formErrors.safety_score}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1">Save Driver Profile</Button>
            <Button variant="outline" type="button" className="flex-1" onClick={() => setActiveForm(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* ── Maintenance Modal (using DynamicForm matching maintenance page exactly) ── */}
      <Modal isOpen={activeForm === 'maintenance'} onClose={() => setActiveForm(null)} title="Log Maintenance Ticket">
        <div className="mb-4">
          <p className="text-sm text-gray-500">Flag vehicle under service ticket. Status sets to In Shop in the database.</p>
        </div>
        <DynamicForm
          schema={getMaintenanceSchema()}
          onSubmit={handleMaintenanceSubmit}
          submitLabel="Log Maintenance Repair"
          errors={formErrors}
        />
      </Modal>
    </div>
  );
}
