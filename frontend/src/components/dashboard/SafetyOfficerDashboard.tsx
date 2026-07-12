'use client';

import React from 'react';
import { MockDriver, TABLE_HEADERS } from '../../constants/dashboardContent';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface SafetyOfficerDashboardProps {
  drivers: MockDriver[];
  onToggleDriverStatus: (driverId: number) => void;
}

export default function SafetyOfficerDashboard({ drivers, onToggleDriverStatus }: SafetyOfficerDashboardProps) {
  // Helpers to calculate dynamic alerts
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const complianceAlerts = drivers.reduce((acc: React.ReactNode[], d) => {
    // 1. License Expiry Check
    if (d.license_expiry) {
      const expiry = new Date(d.license_expiry);
      if (expiry <= today) {
        acc.push(
          <div key={`exp-${d.id}`} className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded flex items-center justify-between">
            <span>❌ Driver <strong>{d.name}</strong> license expired on {d.license_expiry}. Fleet routing blocked.</span>
            <Badge color="error">Critical Expiry</Badge>
          </div>
        );
      } else {
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          acc.push(
            <div key={`warn-${d.id}`} className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded flex items-center justify-between">
              <span>⚠️ Driver <strong>{d.name}</strong> license expires in {diffDays} days ({d.license_expiry}).</span>
              <Badge color="warning">Action Required</Badge>
            </div>
          );
        }
      }
    }

    // 2. Safety Score Critical Alert Check
    if (d.safety_score < 70) {
      acc.push(
        <div key={`score-${d.id}`} className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded flex items-center justify-between">
          <span>❌ Driver <strong>{d.name}</strong> safety score is at {d.safety_score} (Below critical threshold limit of 70). Status Suspended.</span>
          <Badge color="error">Suspension Guard</Badge>
        </div>
      );
    }

    return acc;
  }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* Compliance cards */}
      <Card title="Compliance Alerts & Warnings">
        <div className="space-y-3">
          {complianceAlerts.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">✓ All driver licenses and safety scores are in healthy status.</p>
          ) : (
            complianceAlerts
          )}
        </div>
      </Card>

      {/* Driver List with Controls */}
      <Card title="Driver Safety Ratings & Status Controls">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                {TABLE_HEADERS.drivers.map((header) => (
                  <th key={header} className="pb-3 last:text-right">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => (
                <tr key={d.id} className="text-gray-700">
                  <td className="py-3 font-semibold">{d.name}</td>
                  <td className="py-3">{d.license_expiry}</td>
                  <td className="py-3">
                    <span className={`font-bold ${
                      d.safety_score >= 85 ? 'text-green-600' :
                      d.safety_score >= 70 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {d.safety_score} / 100
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge color={
                      d.status === 'Available' ? 'success' :
                      d.status === 'On Trip' ? 'info' :
                      d.status === 'Suspended' ? 'error' : 'gray'
                    }>
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    {d.status === 'On Trip' ? (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded">On Trip</span>
                    ) : (
                      <Button
                        variant={d.status === 'Suspended' ? 'primary' : 'danger'}
                        size="sm"
                        onClick={() => onToggleDriverStatus(d.id)}
                      >
                        {d.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
