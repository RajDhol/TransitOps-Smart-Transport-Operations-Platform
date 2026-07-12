'use client';

import React, { useState, useEffect } from 'react';
import { FUEL_EXPENSE_TITLES } from '../../constants/fuelExpenseContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DynamicForm, { FormFieldSchema } from '../../components/ui/DynamicForm';

interface Vehicle {
  registration_number: string;
  model: string;
  type: string;
  status: string;
}

interface FuelLog {
  id: number;
  vehicle_reg: string;
  liters: number;
  cost: number;
  log_date: string;
}

interface OtherExpense {
  id: number;
  vehicle_reg: string;
  category: string;
  cost: number;
  expense_date: string;
  notes: string | null;
}

export default function FuelExpensesPage() {
  // Core states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const [isLoading, setIsLoading] = useState(true);

  // Dialog control
  const [activeForm, setActiveForm] = useState<'fuel' | 'expense' | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- API DATA FETCH ---
  const fetchData = async () => {
    try {
      const [vRes, fRes, eRes, sRes] = await Promise.all([
        fetch('http://localhost:8000/api/vehicles'),
        fetch('http://localhost:8000/api/fuel-logs'),
        fetch('http://localhost:8000/api/expenses'),
        fetch('http://localhost:8000/api/settings')
      ]);

      if (vRes.ok && fRes.ok && eRes.ok) {
        setVehicles(await vRes.json());
        setFuelLogs(await fRes.json());
        setExpenses(await eRes.json());
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setCurrencySymbol(sData.currency?.includes('INR') ? 'Rs. ' : '$');
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to synchronize fuel and expenses with the server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper helper to get today's date in YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // --- DYNAMIC FORM OPTIONS ---
  const getFuelSchema = (): FormFieldSchema[] => {
    const activeVehicles = vehicles.filter(v => v.status !== 'Retired');
    return [
      {
        name: 'vehicle_reg',
        label: 'Select Vehicle',
        type: 'select',
        options: activeVehicles.map((v) => ({
          value: v.registration_number,
          label: `${v.registration_number} (${v.model})`,
        })),
        required: true,
      },
      {
        name: 'log_date',
        label: 'Refill Date',
        type: 'date',
        required: true,
      },
      {
        name: 'liters',
        label: 'Liters Refilled (L)',
        type: 'number',
        placeholder: 'e.g. 42',
        required: true,
      },
      {
        name: 'cost',
        label: `Fuel Cost (${currencySymbol.trim()})`,
        type: 'number',
        placeholder: 'e.g. 3150',
        required: true,
      }
    ];
  };

  const getExpenseSchema = (): FormFieldSchema[] => {
    const activeVehicles = vehicles.filter(v => v.status !== 'Retired');
    return [
      {
        name: 'vehicle_reg',
        label: 'Select Vehicle',
        type: 'select',
        options: activeVehicles.map((v) => ({
          value: v.registration_number,
          label: `${v.registration_number} (${v.model})`,
        })),
        required: true,
      },
      {
        name: 'category',
        label: 'Expense Category',
        type: 'select',
        options: [
          { value: 'Toll', label: 'Toll Fees' },
          { value: 'Insurance', label: 'Insurance' },
          { value: 'Permit', label: 'Permit & Licenses' },
          { value: 'Fine', label: 'Fines & Penalties' },
          { value: 'Other', label: 'Other Miscellaneous' }
        ],
        required: true,
      },
      {
        name: 'expense_date',
        label: 'Expense Date',
        type: 'date',
        required: true,
      },
      {
        name: 'cost',
        label: `Cost (${currencySymbol.trim()})`,
        type: 'number',
        placeholder: 'e.g. 120',
        required: true,
      },
      {
        name: 'notes',
        label: 'Notes / Remarks',
        type: 'text',
        placeholder: 'e.g. Toll taxes paid on NH48',
        required: false,
      }
    ];
  };

  // --- ACTIONS & SUBMIT VALIDATIONS ---
  const handleFormSubmit = async (formData: Record<string, string>) => {
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
      if (!formData.log_date) {
        errors.log_date = 'Refill date is required.';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/api/fuel-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_reg: formData.vehicle_reg,
            log_date: formData.log_date,
            liters: litersVal,
            cost: costVal,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to log fuel refill.');

        setNotification({
          type: 'success',
          message: `Fuel log successfully saved for vehicle ${formData.vehicle_reg}.`,
        });
        fetchData();
      } catch (err: any) {
        setNotification({ type: 'error', message: err.message });
      }

    } else if (activeForm === 'expense') {
      const costVal = parseFloat(formData.cost);
      if (isNaN(costVal) || costVal <= 0) {
        errors.cost = 'Cost must be a positive number.';
      }
      if (!formData.expense_date) {
        errors.expense_date = 'Expense date is required.';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_reg: formData.vehicle_reg,
            category: formData.category,
            cost: costVal,
            expense_date: formData.expense_date,
            notes: formData.notes?.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to log expense.');

        setNotification({
          type: 'success',
          message: `Operational expense registered successfully under ${formData.category}.`,
        });
        fetchData();
      } catch (err: any) {
        setNotification({ type: 'error', message: err.message });
      }
    }

    setActiveForm(null);
  };

  const handleDeleteFuel = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/fuel-logs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete fuel log.');
      setNotification({ type: 'success', message: 'Fuel refill log deleted.' });
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense.');
      setNotification({ type: 'success', message: 'Operational expense record deleted.' });
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // --- AUTOMATED OPERATIONS COST SUM ---
  const totalFuelCost = fuelLogs.reduce((acc, f) => acc + f.cost, 0);
  const totalOtherCost = expenses.reduce((acc, e) => acc + e.cost, 0);
  const grandTotalCost = totalFuelCost + totalOtherCost;

  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 border text-sm font-medium rounded flex items-start gap-2.5 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '✖'}</span>
          <div>
            <p className="font-semibold">{notification.type === 'success' ? 'Success' : 'Error'}</p>
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
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Refill Date</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Fuel Cost</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">Loading fuel receipts...</td>
                </tr>
              ) : fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No fuel records logged.</td>
                </tr>
              ) : fuelLogs.map((f) => (
                <tr key={f.id} className="text-gray-700">
                  <td className="py-3 font-semibold">{f.vehicle_reg}</td>
                  <td className="py-3">{f.log_date}</td>
                  <td className="py-3 font-medium">{f.liters.toLocaleString()} L</td>
                  <td className="py-3 font-bold text-gray-900">
                    {currencySymbol}{f.cost.toLocaleString()}
                  </td>
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
      </Card>

      {/* Other Expenses Section */}
      <Card title={FUEL_EXPENSE_TITLES.expenseTitle}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider font-semibold">
                <th className="pb-3">Vehicle</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Cost</th>
                <th className="pb-3">Notes</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">Loading expenses...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No other expenses logged.</td>
                </tr>
              ) : expenses.map((e) => (
                <tr key={e.id} className="text-gray-700">
                  <td className="py-3 font-semibold">{e.vehicle_reg}</td>
                  <td className="py-3 font-medium">{e.expense_date}</td>
                  <td className="py-3">
                    <Badge color={
                      e.category === 'Toll' ? 'success'
                        : e.category === 'Insurance' ? 'info'
                        : e.category === 'Permit' ? 'warning'
                        : e.category === 'Fine' ? 'error'
                        : 'gray'
                    }>
                      {e.category}
                    </Badge>
                  </td>
                  <td className="py-3 font-bold text-gray-900">
                    {currencySymbol}{e.cost.toLocaleString()}
                  </td>
                  <td className="py-3 text-xs max-w-[200px] truncate" title={e.notes || ''}>
                    {e.notes || '—'}
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
      </Card>

      {/* Dynamic Calculated Operations Total Sum */}
      <div className="bg-white border border-gray-200 p-6 rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Total Fuel & Overhead Cost
        </span>
        <span className="text-3xl font-black text-amber-500 tracking-tight">
          {currencySymbol}{grandTotalCost.toLocaleString()}
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
