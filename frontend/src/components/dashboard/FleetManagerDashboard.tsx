'use client';

import React from 'react';
import { MockVehicle, MockDriver, TABLE_HEADERS } from '../../constants/dashboardContent';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface FleetManagerDashboardProps {
  vehicles: MockVehicle[];
  drivers: MockDriver[];
}

export default function FleetManagerDashboard({ vehicles, drivers }: FleetManagerDashboardProps) {
  const stats = [
    { label: 'Total Vehicles', value: vehicles.length },
    { label: 'In Shop (Maintenance)', value: vehicles.filter((v) => v.status === 'In Shop').length, color: 'text-amber-600' },
    { label: 'Available Drivers', value: drivers.filter((d) => d.status === 'Available').length, color: 'text-green-600' },
    { label: 'Fleet Utilization', value: '66.7%', color: 'text-indigo-600' },
  ];

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
            <Button variant="outline" fullWidth>+ Register New Vehicle</Button>
            <Button variant="outline" fullWidth>+ Add New Driver</Button>
            <Button variant="outline" fullWidth>+ Log Maintenance Ticket</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
