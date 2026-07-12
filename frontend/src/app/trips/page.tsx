'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  MockVehicle,
  MockDriver
} from '../../constants/dashboardContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm, { FormFieldSchema } from '../../components/ui/DynamicForm';

interface TripLog {
  id: string;
  source: string;
  destination: string;
  vehicle_reg: string;
  driver_name: string;
  cargo_weight: number;
  planned_distance: number;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
  timeInfo?: string;
}

export default function TripManagementPage() {
  const { user } = useAuth();
  const isOperator = user?.role === 'Fleet Manager' || user?.role === 'Driver';

  // State configurations
  const [vehicles] = useState<MockVehicle[]>(INITIAL_VEHICLES);
  const [drivers] = useState<MockDriver[]>(INITIAL_DRIVERS);

  const [trips, setTrips] = useState<TripLog[]>([
    {
      id: 'TR001',
      source: 'Gandhinagar Depot',
      destination: 'Ahmedabad Hub',
      vehicle_reg: 'VAN-05',
      driver_name: 'Alex',
      cargo_weight: 450,
      planned_distance: 38,
      status: 'Dispatched',
      timeInfo: '45 min',
    },
    {
      id: 'TR004',
      source: 'Vatva Industrial Area',
      destination: 'Sanand Warehouse',
      vehicle_reg: 'TRUCK-04',
      driver_name: 'Suresh',
      cargo_weight: 12000,
      planned_distance: 42,
      status: 'Draft',
      timeInfo: 'Awaiting driver',
    },
    {
      id: 'TR006',
      source: 'Mansa',
      destination: 'Kalol Depot',
      vehicle_reg: 'Unassigned',
      driver_name: 'Unassigned',
      cargo_weight: 0,
      planned_distance: 28,
      status: 'Cancelled',
      timeInfo: 'Vehicle went to shop',
    },
  ]);

  // Form Inputs State
  const [source, setSource] = useState('Gandhinagar Depot');
  const [destination, setDestination] = useState('Ahmedabad Hub');
  const [selectedReg, setSelectedReg] = useState('VAN-05');
  const [selectedDriver, setSelectedDriver] = useState('Alex');
  const [cargoWeight, setCargoWeight] = useState('700'); // Mock default triggers error
  const [plannedDistance, setPlannedDistance] = useState('38');

  // Complete Trip modal states
  const [activeCompleteTripId, setActiveCompleteTripId] = useState<string | null>(null);
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [completeErrors, setCompleteErrors] = useState('');

  // Notifications
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // --- DYNAMIC CALCULATIONS & REAL-TIME VALIDATIONS ---
  const currentVehicle = vehicles.find(v => v.registration_number === selectedReg) || { max_capacity: 500 };
  const cargoNum = parseFloat(cargoWeight) || 0;
  const isOverCapacity = cargoNum > currentVehicle.max_capacity;
  const overage = cargoNum - currentVehicle.max_capacity;

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperator || isOverCapacity) return;

    const nextIndex = trips.length + 1;
    const newTrip: TripLog = {
      id: `TR00${nextIndex}`,
      source: source.trim(),
      destination: destination.trim(),
      vehicle_reg: selectedReg,
      driver_name: selectedDriver,
      cargo_weight: cargoNum,
      planned_distance: parseFloat(plannedDistance) || 0,
      status: 'Dispatched',
      timeInfo: 'Just now',
    };

    setTrips([newTrip, ...trips]);
    setNotification(`Trip ${newTrip.id} successfully created and dispatched!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCancelTrip = (id: string) => {
    if (!isOperator) return;
    setTrips(trips.map(t => t.id === id ? { ...t, status: 'Cancelled', timeInfo: 'Cancelled manually' } : t));
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteErrors('');

    const odo = parseFloat(finalOdometer);
    const fuel = parseFloat(fuelConsumed);

    if (isNaN(odo) || odo <= 0) {
      setCompleteErrors('Please enter a valid final odometer reading.');
      return;
    }
    if (isNaN(fuel) || fuel < 0) {
      setCompleteErrors('Please enter a valid fuel volume.');
      return;
    }

    setTrips(trips.map(t => t.id === activeCompleteTripId ? { ...t, status: 'Completed', timeInfo: 'Completed' } : t));
    setActiveCompleteTripId(null);
    setFinalOdometer('');
    setFuelConsumed('');
    setNotification(`Trip #${activeCompleteTripId} successfully completed! Odometer updated.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded flex items-center gap-2">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Split grid: Form Panel (Left) + Live Board (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Create Trip Form Card */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-md p-6 space-y-6">
          
          {/* Timeline Lifecycle Progress bar */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Trip Lifecycle</span>
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute left-6 right-6 top-3 h-[2px] bg-gray-200 -z-0"></div>
              
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                <span className="text-[10px] font-semibold text-green-600">Draft</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">●</div>
                <span className="text-[10px] font-semibold text-indigo-600">Dispatched</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">●</div>
                <span className="text-[10px] font-semibold text-gray-400">Completed</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">●</div>
                <span className="text-[10px] font-semibold text-gray-400">Cancelled</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Form */}
          <form onSubmit={handleCreateTrip} className="space-y-4">
            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest block">Create Trip</span>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Source</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                required
                disabled={!isOperator}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                required
                disabled={!isOperator}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Vehicle (Available Only)</label>
              <select
                value={selectedReg}
                onChange={e => setSelectedReg(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 text-sm rounded outline-none"
                disabled={!isOperator}
              >
                {vehicles.map(v => (
                  <option key={v.registration_number} value={v.registration_number}>
                    {v.registration_number} - {v.max_capacity} kg capacity
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Driver (Available Only)</label>
              <select
                value={selectedDriver}
                onChange={e => setSelectedDriver(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 text-sm rounded outline-none"
                disabled={!isOperator}
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Cargo Weight (kg)</label>
              <input
                type="number"
                value={cargoWeight}
                onChange={e => setCargoWeight(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                required
                disabled={!isOperator}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Planned Distance (km)</label>
              <input
                type="number"
                value={plannedDistance}
                onChange={e => setPlannedDistance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                required
                disabled={!isOperator}
              />
            </div>

            {/* Reactive Capacity Checker Alertbox */}
            {isOverCapacity && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 space-y-1">
                <p className="text-[11px] font-semibold">Vehicle Capacity: {currentVehicle.max_capacity} kg</p>
                <p className="text-[11px] font-semibold">Cargo Weight: {cargoNum} kg</p>
                <p className="text-xs font-bold mt-1 text-red-600 flex items-center gap-1">
                  <span>✖</span> Capacity exceeded by {overage} kg — dispatch blocked
                </p>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <Button type="submit" disabled={!isOperator || isOverCapacity} className="flex-1">
                {isOverCapacity ? 'Dispatch (disabled)' : 'Dispatch Route'}
              </Button>
              <Button variant="outline" type="button" onClick={() => { setCargoWeight('450'); setFormErrors({}); }} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Right Side: Live Board Cards */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-md p-6 space-y-6">
            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest block">Live Board</span>
            
            <div className="space-y-4">
              {trips.map((t) => (
                <div
                  key={t.id}
                  className="p-5 border border-dashed border-gray-300 rounded flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{t.id}</span>
                      <span className="text-xs text-gray-400 font-semibold uppercase">{t.vehicle_reg} / {t.driver_name}</span>
                    </div>
                    
                    <p className="text-xs font-semibold text-gray-600">{t.source} → {t.destination}</p>
                    
                    {/* Status Badge */}
                    <div className="pt-1">
                      <Badge
                        color={
                          t.status === 'Dispatched'
                            ? 'info'
                            : t.status === 'Completed'
                            ? 'success'
                            : t.status === 'Cancelled'
                            ? 'error'
                            : 'gray'
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 justify-between h-full min-h-[60px]">
                    <span className="text-[11px] font-bold text-gray-400">{t.timeInfo}</span>
                    
                    {/* Action buttons if dispatched and user is operator */}
                    {t.status === 'Dispatched' && isOperator && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setCompleteErrors('');
                            setActiveCompleteTripId(t.id);
                          }}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelTrip(t.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer legend to match visual mockup note */}
            <div className="pt-2">
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                On Complete: odometer → fuel log → expenses → Vehicle & Driver Available
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Completion Modal */}
      <Modal
        isOpen={activeCompleteTripId !== null}
        onClose={() => setActiveCompleteTripId(null)}
        title="Complete Trip & Record Logs"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Enter trip completion parameters to release vehicle and driver.
          </p>

          {completeErrors && (
            <p className="text-xs font-semibold text-red-600">{completeErrors}</p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Final Odometer Reading (km)
            </label>
            <input
              type="number"
              value={finalOdometer}
              onChange={e => setFinalOdometer(e.target.value)}
              placeholder="e.g. 12500"
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Fuel Consumed (liters)
            </label>
            <input
              type="number"
              value={fuelConsumed}
              onChange={e => setFuelConsumed(e.target.value)}
              placeholder="e.g. 45"
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
              required
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1">
              Complete Route
            </Button>
            <Button variant="outline" type="button" onClick={() => setActiveCompleteTripId(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
