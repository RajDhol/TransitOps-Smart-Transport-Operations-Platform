'use client';

import React, { useState } from 'react';
import {
  SETTINGS_TITLES,
  RBAC_HEADERS,
  RBAC_MATRIX
} from '../../constants/settingsContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function SettingsPage() {
  // General configurations state
  const [depotName, setDepotName] = useState('Gandhinagar Depot GJ14');
  const [currency, setCurrency] = useState('INR (Rs)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');

  // Success alert indicator
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('General configurations saved successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded flex items-start gap-2.5">
          <span>✓</span>
          <div>
            <p className="font-semibold">Action Executed Successfully</p>
            <p className="mt-0.5 text-green-700">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-gray-200 p-6 rounded-md">
        <h2 className="text-2xl font-bold tracking-tight">{SETTINGS_TITLES.header}</h2>
        <p className="text-sm text-gray-500 mt-1">{SETTINGS_TITLES.description}</p>
      </div>

      {/* Split grid: General Settings (Left) + RBAC Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* General settings card */}
        <Card className="lg:col-span-5 w-full" title={SETTINGS_TITLES.generalTitle}>
          <form onSubmit={handleSave} className="space-y-6">
            <Input
              label="Depot Name"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
              placeholder="e.g. Gandhinagar Depot GJ14"
              required
            />
            <Input
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="e.g. INR (Rs)"
              required
            />
            <Input
              label="Distance Unit"
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value)}
              placeholder="e.g. Kilometers"
              required
            />
            
            {/* Custom blue save button to match the mockup */}
            <div className="pt-2">
              <Button type="submit">
                {SETTINGS_TITLES.saveButton}
              </Button>
            </div>
          </form>
        </Card>

        {/* RBAC matrix card */}
        <Card className="lg:col-span-7 w-full" title={SETTINGS_TITLES.rbacTitle}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                  {RBAC_HEADERS.map((header) => (
                    <th key={header} className="pb-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RBAC_MATRIX.map((row) => (
                  <tr key={row.role} className="text-gray-700">
                    <td className="py-4 font-bold text-gray-900">{row.role}</td>
                    <td className="py-4">
                      <span className={row.fleet === '✓' ? 'text-green-600 font-bold' : row.fleet === 'View' ? 'text-indigo-500 font-semibold' : 'text-gray-400'}>
                        {row.fleet}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={row.drivers === '✓' ? 'text-green-600 font-bold' : row.drivers === 'View' ? 'text-indigo-500 font-semibold' : 'text-gray-400'}>
                        {row.drivers}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={row.trips === '✓' ? 'text-green-600 font-bold' : row.trips === 'View' ? 'text-indigo-500 font-semibold' : 'text-gray-400'}>
                        {row.trips}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={row.fuelExp === '✓' ? 'text-green-600 font-bold' : row.fuelExp === 'View' ? 'text-indigo-500 font-semibold' : 'text-gray-400'}>
                        {row.fuelExp}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={row.analytics === '✓' ? 'text-green-600 font-bold' : row.analytics === 'View' ? 'text-indigo-500 font-semibold' : 'text-gray-400'}>
                        {row.analytics}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
