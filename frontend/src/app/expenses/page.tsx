'use client';

import React, { useState, useEffect } from 'react';
import { INITIAL_VEHICLES, MockVehicle } from '../../constants/dashboardContent';
import {
  FUEL_EXPENSE_TITLES,
  FUEL_TABLE_HEADERS,
  EXPENSE_TABLE_HEADERS,
  FUEL_FORM_SCHEMA,
  EXPENSE_FORM_SCHEMA
} from '../../constants/fuelExpenseContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm, { FormFieldSchema } from '../../components/ui/DynamicForm';
import Pagination from '../../components/ui/Pagination';

interface FuelLog {
  id: number;
  vehicle_reg: string;
  date: string;
  liters: number;
  cost: number;
}

interface OtherExpense {
  id: number;
  trip_id: string;
  vehicle_reg: string;
  toll: number;
  other: number;
  maint: number;
  status: 'Available' | 'Completed';
}

export default function FuelExpensesPage() {
  // Mock states
  const [vehicles, setVehicles] = useState<MockVehicle[]>(INITIAL_VEHICLES);
  
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([
    { id: 1, vehicle_reg: 'VAN-05', date: '05 Jul 2026', liters: 42, cost: 3150 },
    { id: 2, vehicle_reg: 'TRUCK-11', date: '06 Jul 2026', liters: 110, cost: 8400 },
    { id: 3, vehicle_reg: 'MINI-08', date: '06 Jul 2026', liters: 28, cost: 2050 },
  ]);

  const [expenses, setExpenses] = useState<OtherExpense[]>([
    { id: 1, trip_id: 'TR001', vehicle_reg: 'VAN-05', toll: 120, other: 0, maint: 0, status: 'Available' },
    { id: 2, trip_id: 'TR002', vehicle_reg: 'TRX-12', toll: 340, other: 150, maint: 18000, status: 'Completed' },
    { id: 3, trip_id: 'TR003', vehicle_reg: 'MINI-08', toll: 1860, other: 0, maint: 0, status: 'Available' },
  ]);

  // Fuel Pagination State
  const [currentFuelPage, setCurrentFuelPage] = useState(1);
  const FUEL_ITEMS_PER_PAGE = 5;

  // Expense Pagination State
  const [currentExpensePage, setCurrentExpensePage] = useState(1);
  const EXPENSE_ITEMS_PER_PAGE = 5;

  const totalFuelPages = Math.ceil(fuelLogs.length / FUEL_ITEMS_PER_PAGE);
  const paginatedFuelLogs = fuelLogs.slice(
    (currentFuelPage - 1) * FUEL_ITEMS_PER_PAGE,
    currentFuelPage * FUEL_ITEMS_PER_PAGE
  );

  const totalExpensePages = Math.ceil(expenses.length / EXPENSE_ITEMS_PER_PAGE);
  const paginatedExpenses = expenses.slice(
    (currentExpensePage - 1) * EXPENSE_ITEMS_PER_PAGE,
    currentExpensePage * EXPENSE_ITEMS_PER_PAGE
  );

  // Adjust page if it exceeds total pages
  useEffect(() => {
    if (currentFuelPage > totalFuelPages && totalFuelPages > 0) {
      setCurrentFuelPage(totalFuelPages);
    }
  }, [fuelLogs.length, totalFuelPages, currentFuelPage]);

  useEffect(() => {
    if (currentExpensePage > totalExpensePages && totalExpensePages > 0) {
      setCurrentExpensePage(totalExpensePages);
    }
  }, [expenses.length, totalExpensePages, currentExpensePage]);

  // Dialog control
  const [activeForm, setActiveForm] = useState<'fuel' | 'expense' | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- DYNAMIC FORM OPTIONS ---
  const getFuelSchema = (): FormFieldSchema[] => {
    return [
      {
        name: 'vehicle_reg',
        label: 'Select Vehicle',
        type: 'select',
        options: vehicles.map((v) => ({
          value: v.registration_number,
          label: `${v.registration_number} (${v.model})`,
        })),
        required: true,
      },
      ...FUEL_FORM_SCHEMA,
    ];
  };

  const getExpenseSchema = (): FormFieldSchema[] => {
    return [
      {
        name: 'vehicle_reg',
        label: 'Select Vehicle',
        type: 'select',
        options: vehicles.map((v) => ({
          value: v.registration_number,
          label: `${v.registration_number} (${v.model})`,
        })),
        required: true,
      },
      ...EXPENSE_FORM_SCHEMA,
    ];
  };

  // --- ACTIONS & SUBMIT VALIDATIONS ---
  const handleFormSubmit = (formData: Record<string, string>) => {
    setFormErrors({});
    setNotification(null);
    const errors: Record<string, string> = {};

    if (activeForm === 'fuel') {
      const litersVal = parseFloat(formData.liters);
      if (isNaN(litersVal) || litersVal <= 0) {
        errors.liters = 'Liters must be a positive number.';
      }
      const costVal = parseFloat(formData.cost);
      if (isNaN(costVal) || costVal <= 0) {
        errors.cost = 'Fuel cost must be a positive number.';
      }
      if (!formData.date?.trim()) {
        errors.date = 'Date is required.';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const nextId = fuelLogs.length + 1;
      setFuelLogs([
        ...fuelLogs,
        {
          id: nextId,
          vehicle_reg: formData.vehicle_reg,
          date: formData.date.trim(),
          liters: litersVal,
          cost: costVal,
        },
      ]);
      setNotification({
        type: 'success',
        message: `Fuel log refilled receipt logged successfully for ${formData.vehicle_reg}.`,
      });

    } else if (activeForm === 'expense') {
      if (!formData.trip_id?.trim()) {
        errors.trip_id = 'Trip ID is required.';
      }
      const tollVal = parseFloat(formData.toll);
      if (isNaN(tollVal) || tollVal < 0) {
        errors.toll = 'Toll cost cannot be negative.';
      }
      const otherVal = parseFloat(formData.other);
      if (isNaN(otherVal) || otherVal < 0) {
        errors.other = 'Other cost cannot be negative.';
      }
      const maintVal = parseFloat(formData.maint);
      if (isNaN(maintVal) || maintVal < 0) {
        errors.maint = 'Maintenance cost cannot be negative.';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const nextId = expenses.length + 1;
      setExpenses([
        ...expenses,
        {
          id: nextId,
          trip_id: formData.trip_id.toUpperCase().trim(),
          vehicle_reg: formData.vehicle_reg,
          toll: tollVal,
          other: otherVal,
          maint: maintVal,
          status: formData.status as any,
        },
      ]);
      setNotification({
        type: 'success',
        message: `Expense details successfully logged for trip ${formData.trip_id}.`,
      });
    }

    setActiveForm(null);
  };

  const handleDeleteFuel = (id: number) => {
    setFuelLogs(fuelLogs.filter((f) => f.id !== id));
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  // --- AUTOMATED COST SUM ---
  const totalCost =
    fuelLogs.reduce((acc, f) => acc + f.cost, 0) +
    expenses.reduce((acc, e) => acc + e.toll + e.other + e.maint, 0);

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 border text-sm font-medium rounded flex items-start gap-2.5 bg-green-50 border-green-200 text-green-800`}
        >
          <span>✓</span>
          <div>
            <p className="font-semibold">Action Executed Successfully</p>
            <p className="mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Top Action Row */}
      <div className="flex justify-end items-center gap-3">
        <Button onClick={() => { setFormErrors({}); setActiveForm('fuel'); }} size="sm">
          {FUEL_EXPENSE_TITLES.fuelButton}
        </Button>
        <Button variant="outline" onClick={() => { setFormErrors({}); setActiveForm('expense'); }} size="sm">
          {FUEL_EXPENSE_TITLES.expenseButton}
        </Button>
      </div>

      {/* Fuel Logs Section */}
      <Card title={FUEL_EXPENSE_TITLES.fuelTitle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                {FUEL_TABLE_HEADERS.map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedFuelLogs.map((f) => (
                <tr key={f.id} className="text-gray-700">
                  <td className="py-3 font-semibold">{f.vehicle_reg}</td>
                  <td className="py-3">{f.date}</td>
                  <td className="py-3 font-semibold">{f.liters} L</td>
                  <td className="py-3 font-bold text-gray-900">${f.cost.toLocaleString()}</td>
                  <td className="py-3 text-right flex justify-end">
                    <Button variant="danger" size="sm" onClick={() => handleDeleteFuel(f.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentFuelPage}
          totalPages={totalFuelPages}
          onPageChange={setCurrentFuelPage}
          totalItems={fuelLogs.length}
          itemsPerPage={FUEL_ITEMS_PER_PAGE}
        />
      </Card>

      {/* Other Expenses Section */}
      <Card title={FUEL_EXPENSE_TITLES.expenseTitle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                {EXPENSE_TABLE_HEADERS.map((header) => (
                  <th key={header} className="pb-3 last:text-right">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedExpenses.map((e) => (
                <tr key={e.id} className="text-gray-700">
                  <td className="py-3 font-semibold">{e.trip_id}</td>
                  <td className="py-3 font-mono text-xs">{e.vehicle_reg}</td>
                  <td className="py-3">${e.toll.toLocaleString()}</td>
                  <td className="py-3">${e.other.toLocaleString()}</td>
                  <td className="py-3">${e.maint.toLocaleString()}</td>
                  <td className="py-3">
                    <Badge color={e.status === 'Available' ? 'success' : 'info'}>
                      {e.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right flex justify-end">
                    <Button variant="danger" size="sm" onClick={() => handleDeleteExpense(e.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentExpensePage}
          totalPages={totalExpensePages}
          onPageChange={setCurrentExpensePage}
          totalItems={expenses.length}
          itemsPerPage={EXPENSE_ITEMS_PER_PAGE}
        />
      </Card>

      {/* Dynamic Calculated Operations Total Sum */}
      <div className="bg-white border border-gray-200 p-6 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {FUEL_EXPENSE_TITLES.totalLabel}
        </span>
        <span className="text-3xl font-black text-amber-500 tracking-tight">
          ${totalCost.toLocaleString()}
        </span>
      </div>

      {/* Dialog Modals */}
      <Modal
        isOpen={activeForm !== null}
        onClose={() => setActiveForm(null)}
        title={activeForm === 'fuel' ? 'Log Fuel Refill' : 'Log Expense Record'}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            {activeForm === 'fuel'
              ? 'Enter details from fuel receipts.'
              : 'Enter cost items from business operations.'}
          </p>
        </div>
        <DynamicForm
          schema={activeForm === 'fuel' ? getFuelSchema() : getExpenseSchema()}
          onSubmit={handleFormSubmit}
          submitLabel={activeForm === 'fuel' ? 'Log Fuel' : 'Add Expense'}
          errors={formErrors}
        />
      </Modal>
    </div>
  );
}
