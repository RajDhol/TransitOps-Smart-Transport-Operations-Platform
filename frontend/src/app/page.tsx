'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // Mock KPIs for the dashboard, which we'll fetch from /api/dashboard later
  const mockKpis = [
    { name: 'Active Vehicles', value: 12 },
    { name: 'Available Vehicles', value: 8 },
    { name: 'Vehicles in Maintenance', value: 3 },
    { name: 'Active Trips', value: 6 },
    { name: 'Pending Trips', value: 2 },
    { name: 'Drivers On Duty', value: 15 },
    { name: 'Fleet Utilization', value: '60%' },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="bg-white border border-gray-200 p-6 rounded-md">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h2>
        <p className="text-gray-500 mt-1">
          You are currently logged in with the role of{' '}
          <span className="font-semibold text-indigo-600">{user.role}</span>.
        </p>
        <p className="text-sm text-gray-400 mt-3">
          Notice how the Sidebar items have adjusted. Depending on your role, you will only see the modules you are authorized to manage.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
          Fleet Performance Metrics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockKpis.map((kpi) => (
            <div
              key={kpi.name}
              className="bg-white border border-gray-200 p-6 rounded-md flex flex-col gap-1"
            >
              <span className="text-sm text-gray-500 font-medium">{kpi.name}</span>
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {kpi.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Role Guide Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded-md">
          <h4 className="font-bold text-gray-900 mb-3">Your Role Capabilities:</h4>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            {user.role === 'Fleet Manager' && (
              <>
                <li>Manage Vehicles (Register, edit registry)</li>
                <li>Manage Drivers (Register, update safety scores)</li>
                <li>Log Maintenance & toggle vehicle status</li>
                <li>Review all Expenses & Fuel Logs</li>
                <li>View Financial ROI Analytics</li>
              </>
            )}
            {user.role === 'Driver' && (
              <>
                <li>Create and update trips (Draft, Dispatched)</li>
                <li>Complete trips (Log final odometer & fuel)</li>
                <li>View dashboard updates</li>
              </>
            )}
            {user.role === 'Safety Officer' && (
              <>
                <li>Track driver license compliance and expirations</li>
                <li>Monitor safety scores</li>
                <li>Suspend/reactivate drivers</li>
              </>
            )}
            {user.role === 'Financial Analyst' && (
              <>
                <li>Review operational expenses & fuel efficiency</li>
                <li>Monitor ROI metrics</li>
                <li>Export financial reports (CSV)</li>
              </>
            )}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-md flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Simulate a Different Role</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              If you want to test how the platform behaves for another department, click "Logout" at the top right, select a different role on the login screen, and log back in.
            </p>
          </div>
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 text-xs font-semibold">
            System running in development sandbox mode. Next.js router guards are active.
          </div>
        </div>
      </div>
    </div>
  );
}
