'use client';

import React, { useState, useEffect } from 'react';
import { MockDriver, TABLE_HEADERS } from '../../constants/dashboardContent';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Pagination from '../ui/Pagination';

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

  const [currentPage, setCurrentPage] = useState(1);
  const DRIVERS_PER_PAGE = 5;

  const [sortBy, setSortBy] = useState<'safety-desc' | 'safety-asc' | 'name-asc' | 'name-desc'>('safety-desc');

  // Reset page when sorting changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  // Apply sorting
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (sortBy === 'safety-desc') {
      return b.safety_score - a.safety_score;
    }
    if (sortBy === 'safety-asc') {
      return a.safety_score - b.safety_score;
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedDrivers.length / DRIVERS_PER_PAGE);
  const paginatedDrivers = sortedDrivers.slice(
    (currentPage - 1) * DRIVERS_PER_PAGE,
    currentPage * DRIVERS_PER_PAGE
  );

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
      <Card
        title="Driver Safety Ratings & Status Controls"
        headerActions={
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none bg-white font-sans font-semibold text-gray-700"
          >
            <option value="safety-desc">Safety Score: High to Low (Desc)</option>
            <option value="safety-asc">Safety Score: Low to High (Asc)</option>
            <option value="name-asc">Name: A to Z (Asc)</option>
            <option value="name-desc">Name: Z to A (Desc)</option>
          </select>
        }
      >
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
              {paginatedDrivers.map((d) => (
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
              {paginatedDrivers.length === 0 && (
                <tr>
                  <td colSpan={TABLE_HEADERS.drivers.length} className="text-center py-8 text-gray-400">
                    No drivers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={sortedDrivers.length}
          itemsPerPage={DRIVERS_PER_PAGE}
        />
      </Card>
    </div>
  );
}
