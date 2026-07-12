'use client';

import React, { useState, useEffect } from 'react';
import { TABLE_HEADERS } from '../../constants/dashboardContent';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Pagination from '../ui/Pagination';

interface VehiclePerformance {
  registration_number: string;
  model: string;
  acquisition_cost: number;
  maintenance_cost: number;
  fuel_cost: number;
  revenue: number;
  distance_driven: number;
  fuel_consumed: number;
}

interface FinancialAnalystDashboardProps {
  onExport: () => void;
}

export default function FinancialAnalystDashboard({ onExport }: FinancialAnalystDashboardProps) {
  const [performances, setPerformances] = useState<VehiclePerformance[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summaryStats, setSummaryStats] = useState({
    operationalCost: 0,
    maintenanceCost: 0,
    fuelCost: 0,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchFinancialData = async () => {
    try {
      const [analyticsRes, performanceRes, settingsRes] = await Promise.all([
        fetch('http://localhost:8000/api/reports/analytics'),
        fetch('http://localhost:8000/api/reports/performance'),
        fetch('http://localhost:8000/api/settings')
      ]);

      if (!analyticsRes.ok || !performanceRes.ok) {
        throw new Error('Failed to synchronize financial reports with server.');
      }

      const analyticsData = await analyticsRes.json();
      const performanceData = await performanceRes.json();

      setPerformances(performanceData || []);
      setSummaryStats({
        operationalCost: analyticsData.total_operational_cost || 0,
        maintenanceCost: analyticsData.total_maintenance_cost || 0,
        fuelCost: analyticsData.total_fuel_cost || 0,
      });

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setCurrencySymbol(settingsData.currency?.includes('INR') ? 'Rs. ' : '$');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading financial reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const totalPages = Math.ceil(performances.length / ITEMS_PER_PAGE);
  const paginatedPerformances = performances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const calculateRoi = (p: VehiclePerformance) => {
    if (p.acquisition_cost === 0) return 0;
    const netEarnings = p.revenue - (p.maintenance_cost + p.fuel_cost);
    return (netEarnings / p.acquisition_cost) * 100;
  };

  const costs = [
    { label: 'Total Operational Cost', value: `${currencySymbol}${summaryStats.operationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Total Maintenance Cost', value: `${currencySymbol}${summaryStats.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Total Fuel Expense', value: `${currencySymbol}${summaryStats.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Cost indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {costs.map((cost) => (
          <div key={cost.label} className="bg-white border border-gray-200 p-6 rounded-md shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{cost.label}</span>
            <p className="text-3xl font-black text-gray-900 mt-2">{isLoading ? '...' : cost.value}</p>
          </div>
        ))}
      </div>

      {/* ROI table */}
      <Card
        title="Vehicle Return on Investment (ROI)"
        headerActions={
          <Button variant="primary" size="sm" onClick={onExport}>
            Export Report (CSV)
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                {TABLE_HEADERS.roi.map((header) => (
                  <th key={header} className="pb-3 last:text-right">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.roi.length} className="text-center py-8 text-gray-400">
                    Loading ROI dataset...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.roi.length} className="text-center py-8 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : performances.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.roi.length} className="text-center py-8 text-gray-400">
                    No ROI records available.
                  </td>
                </tr>
              ) : paginatedPerformances.map((p) => {
                const roi = calculateRoi(p);
                return (
                  <tr key={p.registration_number} className="text-gray-700">
                    <td className="py-3 font-semibold">{p.registration_number}</td>
                    <td className="py-3">{currencySymbol}{p.acquisition_cost.toLocaleString()}</td>
                    <td className="py-3">{currencySymbol}{p.maintenance_cost.toLocaleString()}</td>
                    <td className="py-3">{currencySymbol}{p.fuel_cost.toLocaleString()}</td>
                    <td className="py-3">{currencySymbol}{p.revenue.toLocaleString()}</td>
                    <td className={`py-3 font-bold text-right ${roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {roi >= 0 ? `+ ${roi.toFixed(2)}%` : `- ${Math.abs(roi).toFixed(2)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={performances.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Card>
    </div>
  );
}
