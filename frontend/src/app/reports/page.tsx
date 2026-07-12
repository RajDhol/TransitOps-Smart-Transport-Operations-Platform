'use client';

import React, { useState, useEffect } from 'react';
import {
  REPORT_PAGE_TITLES,
  REPORT_TABLE_HEADERS
} from '../../constants/reportContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

interface VehiclePerformance {
  registration_number: string;
  model: string;
  acquisition_cost: number;
  maintenance_cost: number;
  fuel_cost: number;
  expense_cost: number;
  revenue: number;
  distance_driven: number;
  fuel_consumed: number;
}

export default function ReportsPage() {
  const [performances, setPerformances] = useState<VehiclePerformance[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('http://localhost:8000/api/reports/performance'),
        fetch('http://localhost:8000/api/settings')
      ]);

      if (!pRes.ok) {
        throw new Error('Failed to load performance reports from backend.');
      }
      setPerformances(await pRes.json());

      if (sRes.ok) {
        const sData = await sRes.json();
        setCurrencySymbol(sData.currency?.includes('INR') ? 'Rs. ' : '$');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPages = Math.ceil(performances.length / ITEMS_PER_PAGE);
  const paginatedPerformances = performances.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- FORMULA COMPUTATIONS ---
  const calculateEfficiency = (p: VehiclePerformance) => {
    if (p.fuel_consumed === 0) return 0;
    return p.distance_driven / p.fuel_consumed;
  };

  const calculateRoi = (p: VehiclePerformance) => {
    if (p.acquisition_cost === 0) return 0;
    const netEarnings = p.revenue - (p.maintenance_cost + p.fuel_cost + p.expense_cost);
    return (netEarnings / p.acquisition_cost) * 100;
  };

  // --- STATS AGGREGATORS ---
  const totalAcquisition = performances.reduce((sum, p) => sum + p.acquisition_cost, 0);
  const totalMaint = performances.reduce((sum, p) => sum + p.maintenance_cost, 0);
  const totalFuel = performances.reduce((sum, p) => sum + p.fuel_cost, 0);
  const totalExpenses = performances.reduce((sum, p) => sum + p.expense_cost, 0);
  const totalRevenue = performances.reduce((sum, p) => sum + p.revenue, 0);

  const totalOperatingCosts = totalMaint + totalFuel + totalExpenses;
  const netProfit = totalRevenue - totalOperatingCosts;

  const totalCompletedDistance = performances.reduce((sum, p) => sum + p.distance_driven, 0);
  const totalCompletedFuel = performances.reduce((sum, p) => sum + p.fuel_consumed, 0);
  const averageEfficiency = totalCompletedFuel > 0 ? totalCompletedDistance / totalCompletedFuel : 0;

  const fleetRoi = totalAcquisition > 0 ? (netProfit / totalAcquisition) * 100 : 0;

  const stats = [
    { label: REPORT_PAGE_TITLES.totalVehicles, value: performances.length },
    {
      label: REPORT_PAGE_TITLES.netProfit,
      value: `${currencySymbol}${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      color: netProfit >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      label: REPORT_PAGE_TITLES.averageEfficiency,
      value: `${averageEfficiency.toFixed(1)} km/L`,
      color: 'text-indigo-600',
    },
    {
      label: REPORT_PAGE_TITLES.fleetRoi,
      value: `${fleetRoi.toFixed(2)}%`,
      color: fleetRoi >= 0 ? 'text-amber-600' : 'text-red-600',
    },
  ];

  // --- DYNAMIC CSV EXPORTER ---
  const handleCsvExport = () => {
    let csv = `Vehicle Key,Model,Acquisition Cost (${currencySymbol.trim()}),Maintenance Cost (${currencySymbol.trim()}),Fuel Cost (${currencySymbol.trim()}),Overhead Expense (${currencySymbol.trim()}),Revenue Earned (${currencySymbol.trim()}),Fuel Efficiency (km/L),Calculated ROI (%)\n`;

    performances.forEach((p) => {
      const efficiency = calculateEfficiency(p).toFixed(2);
      const roi = calculateRoi(p).toFixed(2);
      csv += `${p.registration_number},${p.model},${p.acquisition_cost},${p.maintenance_cost},${p.fuel_cost},${p.expense_cost},${p.revenue},${efficiency},${roi}%\n`;
    });

    csv += `\nFLEET SUMMARY,,Total Acquisition: ${currencySymbol.trim()}${totalAcquisition},Total Maint: ${currencySymbol.trim()}${totalMaint},Total Fuel: ${currencySymbol.trim()}${totalFuel},Total Overhead: ${currencySymbol.trim()}${totalExpenses},Total Revenue: ${currencySymbol.trim()}${totalRevenue},Average: ${averageEfficiency.toFixed(2)} km/L,Combined ROI: ${fleetRoi.toFixed(2)}%\n`;
    csv += `Net Profit: ${currencySymbol.trim()}${netProfit}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Financial_ROI_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Donut calculation
  const totalCost = totalOperatingCosts || 1; // avoid divide by zero
  const fuelPercent = (totalFuel / totalCost) * 100;
  const maintPercent = (totalMaint / totalCost) * 100;
  const expPercent = (totalExpenses / totalCost) * 100;

  // Render
  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Aggregate stats deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 p-6 rounded-md flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</span>
            <span className={`text-2xl font-black mt-2 text-gray-900 ${stat.color || ''}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      {!isLoading && performances.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart 1: Cost Share Breakup (SVG Donut) */}
          <Card title="Fleet Cost Distribution" className="lg:col-span-5">
            <div className="flex flex-col items-center justify-center p-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Circle 1: Fuel (Indigo) */}
                  <circle
                    cx="18" cy="18" r="15.915"
                    fill="transparent" stroke="#6366f1" strokeWidth="4"
                    strokeDasharray={`${fuelPercent} ${100 - fuelPercent}`}
                    strokeDashoffset="0"
                  />
                  {/* Circle 2: Maintenance (Amber) */}
                  <circle
                    cx="18" cy="18" r="15.915"
                    fill="transparent" stroke="#f59e0b" strokeWidth="4"
                    strokeDasharray={`${maintPercent} ${100 - maintPercent}`}
                    strokeDashoffset={-fuelPercent}
                  />
                  {/* Circle 3: Expenses (Orange) */}
                  <circle
                    cx="18" cy="18" r="15.915"
                    fill="transparent" stroke="#ef4444" strokeWidth="4"
                    strokeDasharray={`${expPercent} ${100 - expPercent}`}
                    strokeDashoffset={-(fuelPercent + maintPercent)}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-gray-900">
                    {currencySymbol.trim()}
                    {Math.round(totalOperatingCosts).toLocaleString()}
                  </span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Total Costs</p>
                </div>
              </div>

              {/* Legends */}
              <div className="w-full grid grid-cols-3 gap-2 mt-8 text-center text-xs">
                <div className="flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 mb-1" />
                  <span className="font-bold text-gray-700">Fuel ({Math.round(fuelPercent)}%)</span>
                  <span className="text-gray-400 mt-0.5">{currencySymbol}{Math.round(totalFuel).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-500 mb-1" />
                  <span className="font-bold text-gray-700">Maint. ({Math.round(maintPercent)}%)</span>
                  <span className="text-gray-400 mt-0.5">{currencySymbol}{Math.round(totalMaint).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mb-1" />
                  <span className="font-bold text-gray-700">Overhead ({Math.round(expPercent)}%)</span>
                  <span className="text-gray-400 mt-0.5">{currencySymbol}{Math.round(totalExpenses).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Chart 2: Top Vehicles by ROI (Visual Bar chart) */}
          <Card title="Top Vehicles by ROI (%)" className="lg:col-span-7">
            <div className="space-y-5 p-2">
              {performances
                .map(p => ({ reg: p.registration_number, model: p.model, roi: calculateRoi(p) }))
                .sort((a, b) => b.roi - a.roi)
                .slice(0, 5)
                .map((item, index) => (
                  <div key={item.reg} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700">#{index + 1} {item.reg} — <span className="text-gray-400 font-normal">{item.model}</span></span>
                      <span className={item.roi >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                        {item.roi.toFixed(1)}% ROI
                      </span>
                    </div>
                    {/* Bar visual */}
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      {item.roi > 0 ? (
                        <div
                          style={{ width: `${Math.min(100, item.roi)}%` }}
                          className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
                        />
                      ) : (
                        <div
                          style={{ width: `${Math.min(100, Math.abs(item.roi))}%` }}
                          className="h-full bg-red-500 rounded-full"
                        />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Roster performance table */}
      <Card
        title={REPORT_PAGE_TITLES.tableTitle}
        headerActions={
          <Button onClick={handleCsvExport} size="sm">
            {REPORT_PAGE_TITLES.exportButton}
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                {REPORT_TABLE_HEADERS.map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={REPORT_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    Loading performance reports...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={REPORT_TABLE_HEADERS.length} className="text-center py-8 text-red-500">
                    {error}
                  </td>
                </tr>
              ) : performances.length === 0 ? (
                <tr>
                  <td colSpan={REPORT_TABLE_HEADERS.length} className="text-center py-8 text-gray-400">
                    No vehicle performance records available.
                  </td>
                </tr>
              ) : paginatedPerformances.map((p) => {
                const efficiency = calculateEfficiency(p);
                const roi = calculateRoi(p);

                return (
                  <tr key={p.registration_number} className="text-gray-700">
                    <td className="py-4 font-semibold">{p.registration_number}</td>
                    <td className="py-4 font-medium text-gray-900">{p.model}</td>
                    <td className="py-4">
                      {currencySymbol}
                      {p.acquisition_cost.toLocaleString()}
                    </td>
                    <td className="py-4 text-amber-600">
                      {currencySymbol}
                      {p.maintenance_cost.toLocaleString()}
                    </td>
                    <td className="py-4 text-orange-600">
                      {currencySymbol}
                      {p.fuel_cost.toLocaleString()}
                    </td>
                    <td className="py-4 text-green-600 font-semibold">
                      {currencySymbol}
                      {p.revenue.toLocaleString()}
                    </td>
                    <td className="py-4 font-semibold text-indigo-600">
                      {efficiency.toFixed(1)} km/L
                    </td>
                    <td className="py-4 last:text-right font-bold">
                      <span className={roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {roi.toFixed(1)}%
                      </span>
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
