'use client';

import React from 'react';
import { TABLE_HEADERS } from '../../constants/dashboardContent';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface FinancialAnalystDashboardProps {
  onExport: () => void;
}

export default function FinancialAnalystDashboard({ onExport }: FinancialAnalystDashboardProps) {
  const costs = [
    { label: 'Total Operational Cost', value: '$2,530.00' },
    { label: 'Total Maintenance Cost', value: '$640.00' },
    { label: 'Total Fuel Expense', value: '$1,890.00' },
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
              <tr className="text-gray-700">
                <td className="py-3 font-semibold">Van-05</td>
                <td className="py-3">$25,000.00</td>
                <td className="py-3">$150.00</td>
                <td className="py-3">$120.00</td>
                <td className="py-3">$450.00</td>
                <td className="py-3 text-green-600 font-bold text-right">+ 0.72%</td>
              </tr>
              <tr className="text-gray-700">
                <td className="py-3 font-semibold">Truck-02</td>
                <td className="py-3">$85,000.00</td>
                <td className="py-3">$490.00</td>
                <td className="py-3">$1,770.00</td>
                <td className="py-3">$2,300.00</td>
                <td className="py-3 text-red-500 font-bold text-right">- 0.05%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
