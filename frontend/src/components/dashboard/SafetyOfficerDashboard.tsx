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
  const [currentPage, setCurrentPage] = useState(1);
  const DRIVERS_PER_PAGE = 5;

  const [sortBy, setSortBy] = useState<'safety-desc' | 'safety-asc' | 'name-asc' | 'name-desc'>('safety-desc');

  // Reset page when sorting changes
  useEffect(() => {
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
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded flex items-center justify-between">
            <span>⚠️ Driver <strong>David</strong> license expires on 2026-05-10. Status has been flagged.</span>
            <Badge color="warning">Action Required</Badge>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded flex items-center justify-between">
            <span>❌ Driver <strong>Michael</strong> safety score is at 74 (Below threshold limit of 75).</span>
            <Badge color="error">Risk Factor</Badge>
          </div>
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
                      d.safety_score >= 90 ? 'text-green-600' :
                      d.safety_score >= 75 ? 'text-amber-600' : 'text-red-600'
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
                    <Button
                      variant={d.status === 'Suspended' ? 'primary' : 'danger'}
                      size="sm"
                      onClick={() => onToggleDriverStatus(d.id)}
                    >
                      {d.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                    </Button>
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
