'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, DashboardStats } from '../services/authService';
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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Filter States
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // System Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [vRes, dRes, tRes] = await Promise.all([
        fetch('http://localhost:8000/api/vehicles'),
        fetch('http://localhost:8000/api/drivers'),
        fetch('http://localhost:8000/api/trips')
      ]);

      if (vRes.ok) {
        const vData = await vRes.json();
        const mappedVehicles = vData.map((v: any) => {
          const parts = v.registration_number.split('-');
          const region = parts.length > 2 ? parts[parts.length - 1] : 'GJ';
          return {
            registration_number: v.registration_number,
            model: v.model,
            type: v.type,
            max_capacity: v.max_load_capacity,
            odometer: v.odometer,
            status: v.status,
            region: region
          };
        });
        setVehicles(mappedVehicles);
      }

      if (dRes.ok) {
        const dData = await dRes.json();
        const mappedDrivers = dData.map((d: any) => ({
          id: d.id,
          name: d.name,
          license_expiry: d.license_expiry_date,
          safety_score: d.safety_score,
          status: d.status,
          license_number: d.license_number,
          license_category: d.license_category,
          contact_number: d.contact_number
        }));
        setDrivers(mappedDrivers);
      }

      if (tRes.ok) {
        const tData = await tRes.json();
        setTrips(tData);
      }
    } catch (err) {
      console.error('Failed to load dashboard lists:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user?.role !== 'Fleet Manager') return;

    async function fetchStats() {
      try {
        const statsData = await getDashboardStats(selectedType, selectedRegion);
        setDashboardStats(statsData);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    }
    fetchStats();
  }, [selectedType, selectedRegion, user?.role]);

  if (!user) return null;

  // --- REACTIVE FILTER CALCULATIONS ---
  const filteredVehicles = vehicles.filter((v) => {
    const matchesType = !selectedType || v.type === selectedType;
    const matchesStatus = !selectedStatus || v.status === selectedStatus;
    const matchesRegion = !selectedRegion || v.region === selectedRegion;
    return matchesType && matchesStatus && matchesRegion;
  });

  // --- ACTIONS & VALIDATIONS ---
  const handleCreateTrip = async (tripForm: {
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

    try {
      const createRes = await fetch('http://localhost:8000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: tripForm.source,
          destination: tripForm.destination,
          vehicle_reg: vehicle.registration_number,
          driver_id: driver.id,
          cargo_weight: cargo,
          planned_distance: distance,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.detail || 'Failed to create trip.');
      }

      const dispatchRes = await fetch(`http://localhost:8000/api/trips/${createData.trip_id}/dispatch`, {
        method: 'POST',
      });
      const dispatchData = await dispatchRes.json();
      if (!dispatchRes.ok) {
        throw new Error(dispatchData.detail || 'Failed to dispatch trip.');
      }

      await fetchDashboardData();
      const statsData = await getDashboardStats(selectedType, selectedRegion);
      setDashboardStats(statsData);
      setInfoMsg(`Trip #${createData.trip_id} successfully dispatched! Vehicle and Driver status set to On Trip.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch trip.');
    }
  };

  const handleCompleteTrip = async (tripId: number, finalOdometer: number, fuelConsumed: number) => {
    setErrorMsg('');
    setInfoMsg('');

    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const vehicle = vehicles.find((v) => v.registration_number === trip.vehicle_reg);
    if (vehicle && finalOdometer <= vehicle.odometer) {
      setErrorMsg(`Final odometer must be greater than current vehicle odometer (${vehicle.odometer} km).`);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/trips/${tripId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_odometer: finalOdometer,
          fuel_consumed_liters: fuelConsumed,
          revenue: 1500,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to complete trip.');
      }

      await fetchDashboardData();
      const statsData = await getDashboardStats(selectedType, selectedRegion);
      setDashboardStats(statsData);
      setInfoMsg(`Trip #${tripId} completed. Vehicle odometer updated to ${finalOdometer} km.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete trip.');
    }
  };

  const handleToggleDriverStatus = async (id: number) => {
    setErrorMsg('');
    setInfoMsg('');

    const driver = drivers.find((d) => d.id === id);
    if (!driver) return;

    const nextAction = driver.status === 'Suspended' ? 'activate' : 'suspend';

    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${id}/${nextAction}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Failed to ${nextAction} driver.`);
      }

      await fetchDashboardData();
      const statsData = await getDashboardStats(selectedType, selectedRegion);
      setDashboardStats(statsData);

      const nextStatus = nextAction === 'activate' ? 'Available' : 'Suspended';
      setInfoMsg(`Driver ${driver.name} status updated to ${nextStatus}.`);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to update driver status.`);
    }
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
          stats={dashboardStats}
          onRegisterVehicle={async (newVehicle) => {
            setErrorMsg('');
            setInfoMsg('');
            try {
              const suffix = `-${newVehicle.region.toUpperCase()}`;
              const regNo = newVehicle.registration_number.toUpperCase().trim();
              const formattedRegNo = regNo.endsWith(suffix) ? regNo : `${regNo}${suffix}`;

              const res = await fetch('http://localhost:8000/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  registration_number: formattedRegNo,
                  model: newVehicle.model.trim(),
                  type: newVehicle.type,
                  max_load_capacity: newVehicle.max_capacity,
                  odometer: newVehicle.odometer,
                  acquisition_cost: (newVehicle as any).acquisition_cost || 150000,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.detail || 'Failed to register vehicle.');
              }
              await fetchDashboardData();
              const statsData = await getDashboardStats(selectedType, selectedRegion);
              setDashboardStats(statsData);
              setInfoMsg(`Vehicle ${newVehicle.registration_number} registered successfully!`);
            } catch (err: any) {
              setErrorMsg(err.message || 'Failed to register vehicle.');
            }
          }}
          onRegisterDriver={async (newDriver) => {
            setErrorMsg('');
            setInfoMsg('');
            try {
              const res = await fetch('http://localhost:8000/api/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: newDriver.name,
                  license_number: newDriver.license_number,
                  license_category: newDriver.license_category,
                  license_expiry_date: newDriver.license_expiry,
                  contact_number: newDriver.contact_number,
                  safety_score: newDriver.safety_score,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                throw new Error(data.detail || 'Failed to register driver.');
              }
              await fetchDashboardData();
              const statsData = await getDashboardStats(selectedType, selectedRegion);
              setDashboardStats(statsData);
              setInfoMsg(`Driver ${newDriver.name} added successfully!`);
            } catch (err: any) {
              setErrorMsg(err.message || 'Failed to register driver.');
            }
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
