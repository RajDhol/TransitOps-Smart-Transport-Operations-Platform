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
  revenue: number;
  distance_driven: number;
  fuel_consumed: number;
}

export default function ReportsPage() {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [performances, setPerformances] = useState<VehiclePerformance[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    try {
      const [analyticsRes, settingsRes] = await Promise.all([
        fetch('http://localhost:8000/api/reports/analytics'),
        fetch('http://localhost:8000/api/settings')
      ]);

      if (!analyticsRes.ok) {
        throw new Error('Failed to load dynamic report analytics from backend.');
      }
      const analyticsData = await analyticsRes.json();
      setPerformances(analyticsData.performances || []);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.currency && settingsData.currency.includes('INR')) {
          setCurrencySymbol('Rs. ');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
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
    const netEarnings = p.revenue - (p.maintenance_cost + p.fuel_cost);
    return (netEarnings / p.acquisition_cost) * 100;
  };

  // --- STATS AGGREGATORS ---

  const totalAcquisition = performances.reduce((sum, p) => sum + p.acquisition_cost, 0);
  const totalMaint = performances.reduce((sum, p) => sum + p.maintenance_cost, 0);
  const totalFuel = performances.reduce((sum, p) => sum + p.fuel_cost, 0);
  const totalRevenue = performances.reduce((sum, p) => sum + p.revenue, 0);

  const netProfit = totalRevenue - (totalMaint + totalFuel);
  const averageEfficiency =
    performances.reduce((sum, p) => sum + calculateEfficiency(p), 0) / performances.length;
  
  const fleetRoi = totalAcquisition > 0 ? (netProfit / totalAcquisition) * 100 : 0;

  const stats = [
    { label: REPORT_PAGE_TITLES.totalVehicles, value: performances.length },
    {
      label: REPORT_PAGE_TITLES.netProfit,
      value: `$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
    // 1. Build Headers
    let csv = 'Vehicle Key,Model & Type,Acquisition Cost ($),Maintenance Cost ($),Fuel Cost ($),Revenue Earned ($),Fuel Efficiency (km/L),Calculated ROI (%)\n';

    // 2. Loop records and add values
    performances.forEach((p) => {
      const efficiency = calculateEfficiency(p).toFixed(2);
      const roi = calculateRoi(p).toFixed(2);
      csv += `${p.registration_number},${p.model},${p.acquisition_cost},${p.maintenance_cost},${p.fuel_cost},${p.revenue},${efficiency},${roi}%\n`;
    });

    // 3. Add Aggregated Totals Row
    csv += `\nFLEET SUMMARY,,Total Acquisition: $${totalAcquisition},Total Maint: $${totalMaint},Total Fuel: $${totalFuel},Total Revenue: $${totalRevenue},Average: ${averageEfficiency.toFixed(2)} km/L,Combined ROI: ${fleetRoi.toFixed(2)}%\n`;
    csv += `Net Profit: $${netProfit}\n`;

    // 4. Download Trigger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Financial_ROI_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Aggregate stats deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 p-6 rounded-md flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{stat.label}</span>
            <span className={`text-3xl font-black mt-2 text-gray-900 ${stat.color || ''}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

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
