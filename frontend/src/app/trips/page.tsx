'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

interface BackendVehicle {
  registration_number: string;
  model: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
}

interface BackendDriver {
  id: number;
  name: string;
  license_expiry_date: string;
  safety_score: number;
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
}

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

  // Live datasets from backend SQLite
  const [vehicles, setVehicles] = useState<BackendVehicle[]>([]);
  const [drivers, setDrivers] = useState<BackendDriver[]>([]);
  const [trips, setTrips] = useState<TripLog[]>([]);

  // Selected trip for lifecycle tracker
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Form Inputs State
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedReg, setSelectedReg] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');

  // Modal complete states
  const [activeCompleteTripId, setActiveCompleteTripId] = useState<string | null>(null);
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [completeErrors, setCompleteErrors] = useState('');

  // Notifications & loading
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- FETCH DATA FROM BACKEND API ---
  const fetchRosterData = async () => {
    try {
      const [vRes, dRes, tRes] = await Promise.all([
        fetch('http://localhost:8000/api/vehicles'),
        fetch('http://localhost:8000/api/drivers'),
        fetch('http://localhost:8000/api/trips'),
      ]);

      if (vRes.ok && dRes.ok && tRes.ok) {
        const vData = await vRes.json();
        const dData = await dRes.json();
        const tData = await tRes.json();

        setVehicles(vData);
        setDrivers(dData);

        // Format raw backend trip objects with timeInfo mappings matching mockup
        const formattedTrips = tData.map((t: any) => {
          let timeInfo = 'Just now';
          if (t.id === 1) timeInfo = '45 min';
          if (t.id === 4) timeInfo = 'Awaiting driver';
          if (t.status === 'Cancelled') timeInfo = 'Vehicle went to shop';

          return {
            id: `TR${String(t.id).padStart(3, '0')}`,
            source: t.source,
            destination: t.destination,
            vehicle_reg: t.vehicle_reg || 'Unassigned',
            driver_name: t.driver_name || 'Unassigned',
            cargo_weight: t.cargo_weight,
            planned_distance: t.planned_distance,
            status: t.status,
            timeInfo,
          };
        });

        setTrips(formattedTrips);

        // Set default selected trip to the first item (top of the list)
        if (formattedTrips.length > 0 && !selectedTripId) {
          setSelectedTripId(formattedTrips[0].id);
        }
      }
    } catch (e) {
      setErrorMsg('Failed to sync data with the backend. Please ensure the FastAPI server is running.');
    }
  };

  useEffect(() => {
    fetchRosterData();
    // Prefill source with configured depot name from Settings
    fetch('http://localhost:8000/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.depot_name) setSource(data.depot_name);
      })
      .catch(() => {}); // silently ignore — source remains empty placeholder
  }, []);

  // Sync default selection when trips list changes
  useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips]);

  // Find currently selected trip details
  const selectedTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  // --- DYNAMIC CAPACITY ALERTS ---
  const currentVehicle = vehicles.find(v => v.registration_number === selectedReg);
  const cargoNum = parseFloat(cargoWeight) || 0;
  const isOverCapacity = currentVehicle ? cargoNum > currentVehicle.max_load_capacity : false;
  const overage = currentVehicle ? cargoNum - currentVehicle.max_load_capacity : 0;

  // --- ACTIONS: CREATE DRAFT (Save as Draft button) ---
  const handleSaveAsDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isOperator || isOverCapacity || isLoading) return;

    setErrorMsg(null);
    setNotification(null);
    setIsLoading(true);

    try {
      const createRes = await fetch('http://localhost:8000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: source.trim(),
          destination: destination.trim(),
          vehicle_reg: selectedReg,
          driver_id: selectedDriverId ? parseInt(selectedDriverId) : null,
          cargo_weight: cargoNum,
          planned_distance: parseFloat(plannedDistance) || 0,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.detail || 'Failed to save trip draft.');
      }

      const tripId = `TR${String(createData.trip_id).padStart(3, '0')}`;
      setNotification(`Trip #${tripId} saved successfully as Draft!`);
      setSelectedTripId(tripId);
      
      // Clear fields
      setSource('');
      setDestination('');
      setCargoWeight('');
      setPlannedDistance('');
      setSelectedReg('');
      setSelectedDriverId('');

      fetchRosterData();

    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS: CREATE & INSTANT DISPATCH (Dispatch Route button) ---
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperator || isOverCapacity || isLoading) return;

    setErrorMsg(null);
    setNotification(null);
    setIsLoading(true);

    try {
      // 1. Create Trip Draft
      const createRes = await fetch('http://localhost:8000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: source.trim(),
          destination: destination.trim(),
          vehicle_reg: selectedReg,
          driver_id: selectedDriverId ? parseInt(selectedDriverId) : null,
          cargo_weight: cargoNum,
          planned_distance: parseFloat(plannedDistance) || 0,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.detail || 'Failed to register trip draft.');
      }

      const rawTripId = createData.trip_id;
      const tripId = `TR${String(rawTripId).padStart(3, '0')}`;

      // 2. Dispatch Trip instantly
      const dispatchRes = await fetch(`http://localhost:8000/api/trips/${rawTripId}/dispatch`, {
        method: 'POST',
      });

      const dispatchData = await dispatchRes.json();
      if (!dispatchRes.ok) {
        throw new Error(dispatchData.detail || 'Trip created, but failed to dispatch.');
      }

      setNotification(`Trip #${tripId} successfully registered and dispatched!`);
      setSelectedTripId(tripId);

      // Clear fields
      setSource('');
      setDestination('');
      setCargoWeight('');
      setPlannedDistance('');
      setSelectedReg('');
      setSelectedDriverId('');

      fetchRosterData();
      
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during dispatch.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS: DISPATCH DRAFT FROM CARD ---
  const handleCardDispatch = async (tripId: string) => {
    setErrorMsg(null);
    setNotification(null);
    const rawId = parseInt(tripId.replace('TR', ''));
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${rawId}/dispatch`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to dispatch trip.');
      }

      setNotification(`Trip #${tripId} has been successfully dispatched to route!`);
      setSelectedTripId(tripId);
      fetchRosterData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during dispatch.');
    }
  };

  // --- ACTIONS: CANCEL ACTIVE OR DRAFT TRIP ---
  const handleCardCancel = async (tripId: string) => {
    setErrorMsg(null);
    setNotification(null);
    const rawId = parseInt(tripId.replace('TR', ''));
    try {
      const res = await fetch(`http://localhost:8000/api/trips/${rawId}/cancel`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to cancel trip.');
      }

      setNotification(`Trip #${tripId} has been successfully cancelled. Assets are released.`);
      setSelectedTripId(tripId);
      fetchRosterData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred during cancellation.');
    }
  };

  // --- ACTIONS: COMPLETE TRIP ---
  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteErrors('');

    const odo = parseFloat(finalOdometer);
    const fuel = parseFloat(fuelConsumed);
    const rawId = parseInt(activeCompleteTripId!.replace('TR', ''));

    if (isNaN(odo) || odo <= 0) {
      setCompleteErrors('Please enter a valid final odometer reading.');
      return;
    }
    if (isNaN(fuel) || fuel < 0) {
      setCompleteErrors('Please enter a valid fuel volume.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/trips/${rawId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_odometer: odo,
          fuel_consumed_liters: fuel,
          revenue: 1200.0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to complete trip.');
      }

      setNotification(`Trip #${activeCompleteTripId} successfully completed! releases assets.`);
      setActiveCompleteTripId(null);
      setFinalOdometer('');
      setFuelConsumed('');
      fetchRosterData();

    } catch (err: any) {
      setCompleteErrors(err.message || 'Error occurred while saving completion logs.');
    }
  };

  // Helper to render dynamic status node colors in timeline progress
  const getTimelineStatus = (stepName: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled') => {
    if (!selectedTrip) return 'gray';
    const currentStatus = selectedTrip.status;

    if (stepName === 'Draft') {
      return 'completed';
    }
    if (stepName === 'Dispatched') {
      if (currentStatus === 'Dispatched') return 'active';
      if (currentStatus === 'Completed' || currentStatus === 'Cancelled') return 'completed';
      return 'gray';
    }
    if (stepName === 'Completed') {
      if (currentStatus === 'Completed') return 'active';
      return 'gray';
    }
    if (stepName === 'Cancelled') {
      if (currentStatus === 'Cancelled') return 'active-cancelled';
      return 'gray';
    }
    return 'gray';
  };

  const availableVehicles = vehicles.filter(v => v.status === 'Available' || v.registration_number === selectedReg);
  const availableDrivers = drivers.filter(d => d.status === 'Available' || String(d.id) === selectedDriverId);

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded flex items-center gap-2">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded flex items-center gap-2">
          <span>✖</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Split grid: Left Column (Timeline + Form) & Right Column (Live Board Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Timeline Header + Create Trip Form Card */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-md p-6 space-y-6">
          
          {/* Timeline Lifecycle Progress bar at the top of Left Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Trip Lifecycle {selectedTrip && `(Active: #${selectedTrip.id})`}
              </span>
            </div>
            
            <div className="flex items-center justify-between relative px-2 py-2">
              <div className="absolute left-6 right-6 top-5 h-[2px] bg-gray-200 -z-0"></div>
              
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[9px] font-bold">✓</div>
                <span className="text-[9px] font-semibold text-green-600">Draft</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                  getTimelineStatus('Dispatched') === 'completed'
                    ? 'bg-green-500'
                    : getTimelineStatus('Dispatched') === 'active'
                    ? 'bg-indigo-600'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {getTimelineStatus('Dispatched') === 'completed' ? '✓' : '●'}
                </div>
                <span className={`text-[9px] font-semibold ${
                  getTimelineStatus('Dispatched') === 'completed'
                    ? 'text-green-600'
                    : getTimelineStatus('Dispatched') === 'active'
                    ? 'text-indigo-600'
                    : 'text-gray-400'
                }`}>
                  Dispatched
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                  getTimelineStatus('Completed') === 'active' ? 'bg-green-500' : 'bg-gray-200 text-gray-400'
                }`}>
                  ●
                </div>
                <span className={`text-[9px] font-semibold ${
                  getTimelineStatus('Completed') === 'active' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  Completed
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                  getTimelineStatus('Cancelled') === 'active-cancelled' ? 'bg-red-500' : 'bg-gray-200 text-gray-400'
                }`}>
                  {getTimelineStatus('Cancelled') === 'active-cancelled' ? '✖' : '●'}
                </div>
                <span className={`text-[9px] font-semibold ${
                  getTimelineStatus('Cancelled') === 'active-cancelled' ? 'text-red-500' : 'text-gray-400'
                }`}>
                  Cancelled
                </span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Form */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest block">Create Trip</span>
            
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="e.g. Gandhinagar Depot"
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                  required
                  disabled={!isOperator || isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="e.g. Ahmedabad Hub"
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                  required
                  disabled={!isOperator || isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Vehicle (Available Only)</label>
                <select
                  value={selectedReg}
                  onChange={e => setSelectedReg(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-sm rounded outline-none"
                  disabled={!isOperator || isLoading}
                  required
                >
                  <option value="">Select a vehicle...</option>
                  {availableVehicles.map(v => (
                    <option key={v.registration_number} value={v.registration_number}>
                      {v.registration_number} ({v.model} - Max: {v.max_load_capacity} kg)
                    </option>
                  ))}
                  {availableVehicles.length === 0 && (
                    <option value="">No vehicles available</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Driver (Available Only)</label>
                <select
                  value={selectedDriverId}
                  onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 text-sm rounded outline-none"
                  disabled={!isOperator || isLoading}
                  required
                >
                  <option value="">Select a driver...</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name} (Score: {d.safety_score})
                    </option>
                  ))}
                  {availableDrivers.length === 0 && (
                    <option value="">No drivers available</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Cargo Weight (kg)</label>
                <input
                  type="number"
                  value={cargoWeight}
                  onChange={e => setCargoWeight(e.target.value)}
                  placeholder="e.g. 450"
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                  required
                  disabled={!isOperator || isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Planned Distance (km)</label>
                <input
                  type="number"
                  value={plannedDistance}
                  onChange={e => setPlannedDistance(e.target.value)}
                  placeholder="e.g. 38"
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
                  required
                  disabled={!isOperator || isLoading}
                />
              </div>

              {/* Reactive Capacity Checker Alertbox */}
              {currentVehicle && isOverCapacity && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 space-y-1">
                  <p className="text-[11px] font-semibold">Vehicle Capacity: {currentVehicle.max_load_capacity} kg</p>
                  <p className="text-[11px] font-semibold">Cargo Weight: {cargoNum} kg</p>
                  <p className="text-xs font-bold mt-1 text-red-600 flex items-center gap-1">
                    <span>✖</span> Capacity exceeded by {overage} kg — dispatch blocked
                  </p>
                </div>
              )}

              <div className="pt-4 flex flex-col gap-2">
                <div className="flex gap-3">
                  <Button type="submit" disabled={!isOperator || isOverCapacity || isLoading} className="flex-1">
                    {isLoading ? 'Processing...' : isOverCapacity ? 'Dispatch (disabled)' : 'Dispatch Route'}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={!isOperator || isOverCapacity || isLoading}
                    onClick={handleSaveAsDraft}
                    className="flex-1"
                  >
                    Save as Draft
                  </Button>
                </div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setSource('');
                    setDestination('');
                    setCargoWeight('');
                    setPlannedDistance('');
                    setSelectedReg('');
                    setSelectedDriverId('');
                  }}
                  className="w-full text-xs py-1.5 text-gray-500 border border-dashed border-gray-200 hover:border-gray-300"
                  disabled={isLoading}
                >
                  Cancel (Clear Form)
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Live Board Cards */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-gray-200 rounded-md p-6 space-y-6">
            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest block">
              Live Board
            </span>
            
            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
              {trips.map((t) => {
                const isSelected = String(t.id) === selectedTripId;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTripId(String(t.id))}
                    className={`p-5 border border-dashed rounded flex justify-between items-center bg-gray-50/50 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500'
                        : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {/* Left Column of Card */}
                    <div className="space-y-2">
                      <span className="text-sm font-bold text-gray-900 block">{t.id}</span>
                      <p className="text-xs font-semibold text-gray-600">{t.source} → {t.destination}</p>
                      
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

                    {/* Right Column of Card */}
                    <div className="flex flex-col items-end gap-2 justify-between min-h-[68px]">
                      <div className="text-right">
                        <span className="text-xs text-gray-400 font-bold uppercase block">{t.vehicle_reg} / {t.driver_name}</span>
                        <span className="text-[11px] font-bold text-gray-400 block mt-1">{t.timeInfo}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* DISPATCH ACTION FOR DRAFT TRIPS */}
                        {t.status === 'Draft' && isOperator && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardDispatch(String(t.id));
                            }}
                          >
                            Dispatch
                          </Button>
                        )}

                        {/* COMPLETE ACTION FOR DISPATCHED TRIPS */}
                        {t.status === 'Dispatched' && isOperator && (
                          <div className="flex gap-1.5">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompleteErrors('');
                                setActiveCompleteTripId(t.id);
                              }}
                            >
                              Complete
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardCancel(String(t.id));
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {trips.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No active dispatches found in the database.
                </div>
              )}
            </div>

            {/* Footer legend to match visual mockup note */}
            <div className="pt-2 border-t border-gray-150 mt-4">
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
