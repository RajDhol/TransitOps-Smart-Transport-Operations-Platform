'use client';

import React from 'react';
import { TABLE_HEADERS } from '../../constants/dashboardContent';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface VehiclePerformance {
  registration_number: string;
  model: string;
  acquisition_cost: number;
  maintenance_cost: number;
  fuel_cost: number;
  expense_cost: number;
  revenue: number;
}

interface FinancialAnalystDashboardProps {
  totalOperationalCost: number;
  totalMaintenanceCost: number;
  totalFuelCost: number;
  performances: VehiclePerformance[];
  currencySymbol: string;
  onExport: () => void;
}

export default function FinancialAnalystDashboard({
  totalOperationalCost,
  totalMaintenanceCost,
  totalFuelCost,
  performances,
  currencySymbol,
  onExport,
}: FinancialAnalystDashboardProps) {
  
  const calculateRoi = (p: VehiclePerformance) => {
    if (p.acquisition_cost === 0) return 0;
    const netEarnings = p.revenue - (p.maintenance_cost + p.fuel_cost + p.expense_cost);
    return (netEarnings / p.acquisition_cost) * 100;
  };

  const costs = [
    { label: 'Total Operational Cost', value: `${currencySymbol}${totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Total Maintenance Cost', value: `${currencySymbol}${totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Total Fuel Expense', value: `${currencySymbol}${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Cost indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {costs.map((cost) => (
          <div key={cost.label} className="bg-white border border-gray-200 p-6 rounded-md">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{cost.label}</span>
            <p className="text-3xl font-black text-gray-900 mt-2">{cost.value}</p>
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
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.roi.length} className="text-center py-6 text-gray-400">
                    No vehicle ROI telemetry found.
                  </td>
                </tr>
              ) : performances.map((p) => {
                const roi = calculateRoi(p);
                return (
                  <tr key={p.registration_number} className="text-gray-700">
                    <td className="py-3 font-semibold">{p.registration_number}</td>
                    <td className="py-3">{currencySymbol}{p.acquisition_cost.toLocaleString()}</td>
                    <td className="py-3 text-amber-600">{currencySymbol}{p.maintenance_cost.toLocaleString()}</td>
                    <td className="py-3 text-orange-600">{currencySymbol}{p.fuel_cost.toLocaleString()}</td>
                    <td className="py-3 text-green-600">{currencySymbol}{p.revenue.toLocaleString()}</td>
                    <td className={`py-3 font-bold text-right ${roi >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {roi >= 0 ? '+' : ''} {roi.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
