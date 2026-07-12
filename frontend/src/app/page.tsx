'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  DASHBOARD_TITLES,
  MockVehicle,
  MockDriver,
  MockTrip
} from '../constants/dashboardContent';

import FleetManagerDashboard from '../components/dashboard/FleetManagerDashboard';
import DriverDashboard from '../components/dashboard/DriverDashboard';
import SafetyOfficerDashboard from '../components/dashboard/SafetyOfficerDashboard';
import FinancialAnalystDashboard from '../components/dashboard/FinancialAnalystDashboard';
import DashboardFilters from '../components/dashboard/DashboardFilters';

export default function DashboardPage() {
  const { user } = useAuth();

  // Core Reactive States
  const [vehicles, setVehicles] = useState<MockVehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<MockDriver[]>(INITIAL_DRIVERS);
  const [trips, setTrips] = useState<MockTrip[]>(INITIAL_TRIPS);

  // Filter States
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // System Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!user) return null;

  // --- REACTIVE FILTER CALCULATIONS ---
  const filteredVehicles = vehicles.filter((v) => {
    const matchesType = !selectedType || v.type === selectedType;
    const matchesStatus = !selectedStatus || v.status === selectedStatus;
    const matchesRegion = !selectedRegion || v.region === selectedRegion;
    return matchesType && matchesStatus && matchesRegion;
  });

  // --- ACTIONS & VALIDATIONS ---
  const handleCreateTrip = (tripForm: {
    source: string;
    destination: string;
    vehicle_reg: string;
    driver_id: string;
    cargo_weight: string;
    planned_distance: string;
  }) => {
    setErrorMsg('');
    setInfoMsg('');

    const cargo = parseFloat(tripForm.cargo_weight);
    const distance = parseFloat(tripForm.planned_distance);
    const driverId = parseInt(tripForm.driver_id);

    const vehicle = vehicles.find((v) => v.registration_number === tripForm.vehicle_reg);
    const driver = drivers.find((d) => d.id === driverId);

    if (!vehicle || !driver) {
      setErrorMsg('Please select a valid vehicle and driver.');
      return;
    }

    // Business Rules
    if (vehicle.status !== 'Available') {
      setErrorMsg(`Vehicle ${vehicle.registration_number} is currently ${vehicle.status} and cannot be dispatched.`);
      return;
    }

    if (driver.status !== 'Available') {
      setErrorMsg(`Driver ${driver.name} is currently ${driver.status} and cannot be assigned.`);
      return;
    }

    const expiryDate = new Date(driver.license_expiry);
    const currentDate = new Date();
    if (expiryDate < currentDate) {
      setErrorMsg(`Driver ${driver.name} has an expired license (Expired: ${driver.license_expiry}).`);
      return;
    }

    if (cargo > vehicle.max_capacity) {
      setErrorMsg(`Cargo weight (${cargo}kg) exceeds vehicle maximum capacity (${vehicle.max_capacity}kg).`);
      return;
    }

    // Success State Transition
    const newTripId = trips.length + 101;
    const addedTrip: MockTrip = {
      id: newTripId,
      source: tripForm.source,
      destination: tripForm.destination,
      vehicle_reg: vehicle.registration_number,
      driver_name: driver.name,
      cargo_weight: cargo,
      planned_distance: distance,
      status: 'Dispatched',
    };

    setTrips([...trips, addedTrip]);
    setVehicles(
      vehicles.map((v) =>
        v.registration_number === vehicle.registration_number ? { ...v, status: 'On Trip' } : v
      )
    );
    setDrivers(drivers.map((d) => (d.id === driver.id ? { ...d, status: 'On Trip' } : d)));

    setInfoMsg(`Trip #${newTripId} successfully dispatched! Vehicle and Driver status set to On Trip.`);
  };

  const handleCompleteTrip = (tripId: number, finalOdometer: number, fuelConsumed: number) => {
    setErrorMsg('');
    setInfoMsg('');

    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const vehicle = vehicles.find((v) => v.registration_number === trip.vehicle_reg);
    if (vehicle && finalOdometer <= vehicle.odometer) {
      setErrorMsg(`Final odometer must be greater than current vehicle odometer (${vehicle.odometer} km).`);
      return;
    }

    setTrips(
      trips.map((t) =>
        t.id === tripId
          ? { ...t, status: 'Completed', final_odometer: finalOdometer, fuel_consumed: fuelConsumed }
          : t
      )
    );
    setVehicles(
      vehicles.map((v) =>
        v.registration_number === trip.vehicle_reg
          ? { ...v, status: 'Available', odometer: finalOdometer }
          : v
      )
    );
    setDrivers(drivers.map((d) => (d.name === trip.driver_name ? { ...d, status: 'Available' } : d)));

    setInfoMsg(`Trip #${tripId} completed. Vehicle odometer updated to ${finalOdometer} km.`);
  };

  const handleToggleDriverStatus = (id: number) => {
    setErrorMsg('');
    setInfoMsg('');

    setDrivers(
      drivers.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'Suspended' ? 'Available' : 'Suspended';
          setInfoMsg(`Driver ${d.name} status updated to ${nextStatus}.`);
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  const handleExport = () => {
    setErrorMsg('');
    setInfoMsg('');

    const csvContent =
      'data:text/csv;charset=utf-8,Vehicle,Acquisition Cost,Maintenance,Fuel,Revenue,ROI\nVan-05,25000,150,120,450,0.007\nTruck-02,85000,490,1770,2300,-0.0004';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'transitops_vehicle_roi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setInfoMsg('ROI report exported to CSV successfully.');
  };

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded flex items-start gap-2.5">
          <span className="font-bold text-red-500">!</span>
          <div>
            <p className="font-semibold">Business Rule Validation Failed</p>
            <p className="mt-0.5 text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}
      {infoMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded flex items-start gap-2.5">
          <span className="text-green-500">✓</span>
          <div>
            <p className="font-semibold">Action Executed Successfully</p>
            <p className="mt-0.5 text-green-700">{infoMsg}</p>
          </div>
        </div>
      )}



      {/* Filter Component */}
      <DashboardFilters
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
      />

      {/* Dynamic Role-Based Views */}
      {user.role === 'Fleet Manager' && (
        <FleetManagerDashboard
          vehicles={filteredVehicles}
          drivers={drivers}
          onRegisterVehicle={(newVehicle) => {
            setVehicles([newVehicle, ...vehicles]);
            setInfoMsg(`Vehicle ${newVehicle.registration_number} registered successfully!`);
          }}
          onRegisterDriver={(newDriver) => {
            setDrivers([...drivers, newDriver]);
            setInfoMsg(`Driver ${newDriver.name} added successfully!`);
          }}
        />
      )}
      {user.role === 'Driver' && (
        <DriverDashboard
          vehicles={filteredVehicles}
          drivers={drivers}
          trips={trips}
          onCreateTrip={handleCreateTrip}
          onCompleteTrip={handleCompleteTrip}
        />
      )}
      {user.role === 'Safety Officer' && (
        <SafetyOfficerDashboard drivers={drivers} onToggleDriverStatus={handleToggleDriverStatus} />
      )}
      {user.role === 'Financial Analyst' && (
        <FinancialAnalystDashboard onExport={handleExport} />
      )}
    </div>
  );
}
