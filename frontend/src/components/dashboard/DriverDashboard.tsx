'use client';

import React, { useState } from 'react';
import { MockVehicle, MockDriver, MockTrip } from '../../constants/dashboardContent';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Pagination from '../ui/Pagination';

interface DriverDashboardProps {
  vehicles: MockVehicle[];
  drivers: MockDriver[];
  trips: MockTrip[];
  onCreateTrip: (tripData: any) => void;
  onCompleteTrip: (tripId: number, finalOdo: number, fuel: number) => void;
}

export default function DriverDashboard({
  vehicles,
  drivers,
  trips,
  onCreateTrip,
  onCompleteTrip,
}: DriverDashboardProps) {
  const [newTrip, setNewTrip] = useState({ source: '', destination: '', vehicle_reg: '', driver_id: '', cargo_weight: '', planned_distance: '' });
  const [completeTripId, setCompleteTripId] = useState<number | null>(null);
  const [completionData, setCompletionData] = useState({ final_odometer: '', fuel_consumed: '' });
  const [tripPage, setTripPage] = useState(1);
  const TRIPS_PER_PAGE = 5;

  const handleSubmitTrip = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTrip(newTrip);
    setNewTrip({ source: '', destination: '', vehicle_reg: '', driver_id: '', cargo_weight: '', planned_distance: '' });
  };

  const handleSubmitCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTripId) return;
    onCompleteTrip(completeTripId, parseFloat(completionData.final_odometer), parseFloat(completionData.fuel_consumed));
    setCompleteTripId(null);
    setCompletionData({ final_odometer: '', fuel_consumed: '' });
  };

  const vehicleOptions = [
    { value: '', label: '-- Choose Vehicle --' },
    ...vehicles.map((v) => ({
      value: v.registration_number,
      label: `${v.registration_number} (${v.model} - Max ${v.max_capacity}kg) [${v.status}]`,
    })),
  ];

  const driverOptions = [
    { value: '', label: '-- Choose Driver --' },
    ...drivers.map((d) => ({
      value: d.id.toString(),
      label: `${d.name} (Safety: ${d.safety_score}) [${d.status}]`,
    })),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans">
      {/* Dispatch Panel */}
      <Card title="Create & Dispatch Trip" subtitle="Assign an available vehicle and driver.">
        <form onSubmit={handleSubmitTrip} className="space-y-4">
          <Input
            label="Source Location"
            value={newTrip.source}
            onChange={(e) => setNewTrip({ ...newTrip, source: e.target.value })}
            placeholder="Warehouse A"
            required
          />
          <Input
            label="Destination Location"
            value={newTrip.destination}
            onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
            placeholder="Retail Depot B"
            required
          />
          <Input
            label="Cargo Weight (kg)"
            type="number"
            value={newTrip.cargo_weight}
            onChange={(e) => setNewTrip({ ...newTrip, cargo_weight: e.target.value })}
            placeholder="450"
            required
          />
          <Input
            label="Planned Distance (km)"
            type="number"
            value={newTrip.planned_distance}
            onChange={(e) => setNewTrip({ ...newTrip, planned_distance: e.target.value })}
            placeholder="120"
            required
          />
          <Select
            label="Select Vehicle"
            value={newTrip.vehicle_reg}
            onChange={(e) => setNewTrip({ ...newTrip, vehicle_reg: e.target.value })}
            options={vehicleOptions}
            required
          />
          <Select
            label="Select Driver"
            value={newTrip.driver_id}
            onChange={(e) => setNewTrip({ ...newTrip, driver_id: e.target.value })}
            options={driverOptions}
            required
          />
          <Button type="submit" fullWidth>Dispatch Trip</Button>
        </form>
      </Card>

      {/* Trips list */}
      <div className="lg:col-span-2 space-y-6">
        <Card title="Active & Assigned Trips">
          <div className="space-y-4">
            {(() => {
              const activeTrips = trips.filter((t) => t.status === 'Dispatched' || t.status === 'Draft');
              const totalPages = Math.ceil(activeTrips.length / TRIPS_PER_PAGE);
              const paginatedTrips = activeTrips.slice(
                (tripPage - 1) * TRIPS_PER_PAGE,
                tripPage * TRIPS_PER_PAGE
              );

              if (activeTrips.length === 0) {
                return <p className="text-sm text-gray-400 text-center py-6">No active or pending trips found.</p>;
              }

              return (
                <>
                  {paginatedTrips.map((trip) => (
                    <div key={trip.id} className="border border-gray-200 p-4 rounded bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">Trip #{trip.id}</span>
                          <Badge color={trip.status === 'Dispatched' ? 'info' : 'gray'}>
                            {trip.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Route: <span className="font-medium text-gray-800">{trip.source}</span> → <span className="font-medium text-gray-800">{trip.destination}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Vehicle: {trip.vehicle_reg} | Driver: {trip.driver_name} | Cargo: {trip.cargo_weight} kg
                        </p>
                      </div>

                      {trip.status === 'Dispatched' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setCompleteTripId(trip.id)}
                        >
                          Complete Trip
                        </Button>
                      )}
                    </div>
                  ))}
                  <Pagination
                    currentPage={tripPage}
                    totalPages={totalPages}
                    onPageChange={setTripPage}
                    totalItems={activeTrips.length}
                    itemsPerPage={TRIPS_PER_PAGE}
                  />
                </>
              );
            })()}
          </div>
        </Card>

        {/* Complete Trip popup */}
        {completeTripId && (
          <Card title={`Complete Trip #${completeTripId}`} variant="gray">
            <form onSubmit={handleSubmitCompletion} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Input
                label="Final Odometer (km)"
                type="number"
                value={completionData.final_odometer}
                onChange={(e) => setCompletionData({ ...completionData, final_odometer: e.target.value })}
                placeholder="12150"
                required
              />
              <Input
                label="Fuel Consumed (L)"
                type="number"
                value={completionData.fuel_consumed}
                onChange={(e) => setCompletionData({ ...completionData, fuel_consumed: e.target.value })}
                placeholder="15.5"
                required
              />
              <div className="flex gap-2">
                <Button type="submit" variant="success" fullWidth>Submit</Button>
                <Button type="button" variant="outline" onClick={() => setCompleteTripId(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
