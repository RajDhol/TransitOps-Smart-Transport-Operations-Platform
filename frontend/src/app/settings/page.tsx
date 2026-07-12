'use client';

import React, { useState, useEffect } from 'react';
import { SETTINGS_TITLES, RBAC_HEADERS } from '../../constants/settingsContent';
import { NAVIGATION_ITEMS, USER_ROLES } from '../../constants/uiConfig';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function SettingsPage() {
  // General configurations state
  const [depotName, setDepotName] = useState('');
  const [currency, setCurrency] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Success / error alert indicators
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current settings from backend on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/settings')
      .then(res => res.json())
      .then(data => {
        setDepotName(data.depot_name);
        setCurrency(data.currency);
        setDistanceUnit(data.distance_unit);
      })
      .catch(() => setErrorMsg('Could not load settings from server.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depot_name: depotName,
          currency,
          distance_unit: distanceUnit,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save settings.');
      }
      setSuccessMsg('Settings saved! Trips will now auto-fill "' + depotName + '" as the source depot.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  };

  // --- DYNAMIC RBAC RESOLVER FROM UICONFIG ---
  const getPermissionStatus = (role: string, targetPath: string) => {
    // Find the matching menu item from centralized uiConfig
    const item = NAVIGATION_ITEMS.find((nav) => nav.href === targetPath);
    if (!item) return '—';

    const hasAccess = item.allowedRoles.includes(role as any);
    if (!hasAccess) return '—';

    // UI Customization: Match visual 'View' label cues from the mockup design
    if (role === 'Driver' && targetPath === '/vehicles') return 'View';
    if (role === 'Safety Officer' && targetPath === '/trips') return 'View';
    if (role === 'Financial Analyst' && targetPath === '/vehicles') return 'View';

    return '✓';
  };

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded flex items-start gap-2.5">
          <span>✓</span>
          <div>
            <p className="font-semibold">Saved to Database</p>
            <p className="mt-0.5 text-green-700">{successMsg}</p>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded flex items-center gap-2">
          <span>✖</span> {errorMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-gray-200 p-6 rounded-md">
        <p className="text-sm text-gray-500">{SETTINGS_TITLES.description}</p>
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
            
            <div className="pt-2">
              <Button type="submit">
                {SETTINGS_TITLES.saveButton}
              </Button>
            </div>
          </form>
        </Card>

        {/* Dynamic RBAC matrix card */}
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
                {USER_ROLES.map((role) => {
                  // Map display names to match standard labels
                  const displayRole = role === 'Driver' ? 'Dispatcher (Driver)' : role;

                  return (
                    <tr key={role} className="text-gray-700">
                      <td className="py-4 font-bold text-gray-900">{displayRole}</td>
                      <td className="py-4">
                        <span className="font-semibold">{getPermissionStatus(role, '/vehicles')}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold">{getPermissionStatus(role, '/drivers')}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold">{getPermissionStatus(role, '/trips')}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold">{getPermissionStatus(role, '/expenses')}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold">{getPermissionStatus(role, '/reports')}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
