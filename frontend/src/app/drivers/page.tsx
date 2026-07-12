'use client';

import React, { useState, useEffect } from 'react';
import {
  DRIVER_PAGE_TITLES,
  LICENSE_CATEGORIES,
  DRIVER_TABLE_HEADERS,
} from '../../constants/driverContent';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

// ---- Types ----------------------------------------------------------------
interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string;
  contact_number: string;
  safety_score: number;
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
}

// ---- Component ------------------------------------------------------------
export default function DriverManagementPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Register Driver Modal ---
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '', license_number: '', license_category: 'Class A CDL',
    license_expiry_date: '', contact_number: '', safety_score: '100',
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  // --- Safety Event Modal ---
  const [safetyTarget, setSafetyTarget] = useState<Driver | null>(null);
  const [safetyForm, setSafetyForm] = useState({ event_type: '', points: '', notes: '' });
  const [safetyErrors, setSafetyErrors] = useState<Record<string, string>>({});
  const [isSubmittingSafety, setIsSubmittingSafety] = useState(false);

  // ---- Fetch drivers from backend ------------------------------------------
  const fetchDrivers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch {
      showNotification('error', 'Could not connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ---- Register Driver -----------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!registerForm.name.trim()) errors.name = 'Full name is required.';
    if (!registerForm.license_number.trim()) errors.license_number = 'License number is required.';
    if (!registerForm.license_expiry_date) errors.license_expiry_date = 'Expiry date is required.';
    if (!registerForm.contact_number.trim()) errors.contact_number = 'Contact number is required.';
    const score = parseInt(registerForm.safety_score);
    if (isNaN(score) || score < 0 || score > 100) errors.safety_score = 'Score must be 0–100.';

    if (Object.keys(errors).length > 0) { setRegisterErrors(errors); return; }
    setRegisterErrors({});
    setIsRegistering(true);

    try {
      const res = await fetch('http://localhost:8000/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          license_number: registerForm.license_number.trim().toUpperCase(),
          license_category: registerForm.license_category,
          license_expiry_date: registerForm.license_expiry_date,
          contact_number: registerForm.contact_number.trim(),
          safety_score: score,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed.');

      showNotification('success', `Driver "${registerForm.name}" registered successfully.`);
      setIsRegisterOpen(false);
      setRegisterForm({ name: '', license_number: '', license_category: 'LMV', license_expiry_date: '', contact_number: '', safety_score: '100' });
      fetchDrivers();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  // ---- Suspend / Activate --------------------------------------------------
  const handleSuspend = async (driver: Driver) => {
    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${driver.id}/suspend`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to suspend driver.');
      showNotification('success', `${driver.name} has been suspended.`);
      fetchDrivers();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleActivate = async (driver: Driver) => {
    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${driver.id}/activate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to activate driver.');
      showNotification('success', `${driver.name} is now Available.`);
      fetchDrivers();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // ---- Safety Event --------------------------------------------------------
  const handleSafetySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!safetyForm.event_type.trim()) errors.event_type = 'Event type is required.';
    const pts = parseInt(safetyForm.points);
    if (isNaN(pts) || pts === 0 || pts < -100 || pts > 100)
      errors.points = 'Points must be between -100 and 100 (non-zero).';

    if (Object.keys(errors).length > 0) { setSafetyErrors(errors); return; }
    setSafetyErrors({});
    setIsSubmittingSafety(true);

    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${safetyTarget!.id}/safety-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: safetyForm.event_type.trim(),
          points: pts,
          notes: safetyForm.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to log safety event.');

      // Immediately update the safety score in the local list
      setDrivers(prev =>
        prev.map(d => d.id === safetyTarget!.id ? { ...d, safety_score: data.safety_score } : d)
      );

      const sign = pts > 0 ? '+' : '';
      showNotification('success',
        `Safety event logged for ${safetyTarget!.name}. Score: ${safetyTarget!.safety_score} → ${data.safety_score} (${sign}${pts} pts)`
      );
      setSafetyTarget(null);
      setSafetyForm({ event_type: '', points: '', notes: '' });
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmittingSafety(false);
    }
  };

  // ---- Filter --------------------------------------------------------------
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.license_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ---- Score color helper --------------------------------------------------
  const scoreColor = (score: number) =>
    score >= 85 ? 'text-green-600' : score >= 70 ? 'text-amber-500' : 'text-red-500';

  // ---- Render --------------------------------------------------------------
  return (
    <div className="space-y-8 font-sans text-gray-900 pb-12">

      {/* Notification banner */}
      {notification && (
        <div className={`p-4 border text-sm font-medium rounded flex items-start gap-2.5 ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{notification.type === 'success' ? '✓' : '✖'}</span>
          <p>{notification.message}</p>
        </div>
      )}

      {/* Driver Roster Table */}
      <Card
        title={DRIVER_PAGE_TITLES.listTitle}
        headerActions={
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <Button onClick={() => setIsRegisterOpen(true)} size="sm">
              {DRIVER_PAGE_TITLES.registerButton}
            </Button>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={DRIVER_PAGE_TITLES.searchPlaceholder}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none focus:border-indigo-500 bg-white w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 text-xs rounded outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-3">#</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">License No.</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Expiry</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Safety Score</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400 text-sm">
                    Loading drivers from database...
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400 text-sm">
                    No drivers found matching search or filters.
                  </td>
                </tr>
              ) : filteredDrivers.map(d => (
                <tr key={d.id} className="text-gray-700">
                  <td className="py-3 font-semibold">#{d.id}</td>
                  <td className="py-3 font-semibold">{d.name}</td>
                  <td className="py-3 font-mono text-xs">{d.license_number}</td>
                  <td className="py-3">{d.license_category}</td>
                  <td className="py-3 font-medium">{d.license_expiry_date}</td>
                  <td className="py-3 text-xs">{d.contact_number}</td>

                  {/* Safety Score with color + Log button */}
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${scoreColor(d.safety_score)}`}>
                        {d.safety_score} / 100
                      </span>
                      <button
                        onClick={() => {
                          setSafetyTarget(d);
                          setSafetyForm({ event_type: '', points: '', notes: '' });
                          setSafetyErrors({});
                        }}
                        title="Log Safety Event"
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        + Log
                      </button>
                    </div>
                  </td>

                  <td className="py-3">
                    <Badge color={
                      d.status === 'Available' ? 'success'
                        : d.status === 'On Trip' ? 'info'
                        : d.status === 'Off Duty' ? 'gray'
                        : 'error'
                    }>
                      {d.status}
                    </Badge>
                  </td>

                  <td className="py-3 text-right">
                    {d.status !== 'Suspended' ? (
                      <Button variant="outline" size="sm" onClick={() => handleSuspend(d)}>
                        Suspend
                      </Button>
                    ) : (
                      <Button variant="success" size="sm" onClick={() => handleActivate(d)}>
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Register Driver Modal ─────────────────────────────────────── */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title={DRIVER_PAGE_TITLES.formTitle}>
        <p className="text-sm text-gray-500 mb-5">{DRIVER_PAGE_TITLES.formSubtitle}</p>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">

          {(['name', 'license_number', 'contact_number'] as const).map(field => (
            <div key={field} className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                {field.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={registerForm[field]}
                onChange={e => setRegisterForm(f => ({ ...f, [field]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500"
                placeholder={field === 'name' ? 'e.g. Rajesh Sharma' : field === 'license_number' ? 'e.g. GJ14 20230012345' : '+91 98765 43210'}
              />
              {registerErrors[field] && <p className="text-xs text-red-500">{registerErrors[field]}</p>}
            </div>
          ))}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">License Category</label>
            <select
              value={registerForm.license_category}
              onChange={e => setRegisterForm(f => ({ ...f, license_category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none bg-white"
            >
              {LICENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">License Expiry Date</label>
            <input
              type="date"
              value={registerForm.license_expiry_date}
              onChange={e => setRegisterForm(f => ({ ...f, license_expiry_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500"
            />
            {registerErrors.license_expiry_date && <p className="text-xs text-red-500">{registerErrors.license_expiry_date}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Initial Safety Score (0–100)</label>
            <input
              type="number"
              min={0} max={100}
              value={registerForm.safety_score}
              onChange={e => setRegisterForm(f => ({ ...f, safety_score: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500"
            />
            {registerErrors.safety_score && <p className="text-xs text-red-500">{registerErrors.safety_score}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1" disabled={isRegistering}>
              {isRegistering ? 'Registering...' : 'Save Driver Profile'}
            </Button>
            <Button variant="outline" type="button" className="flex-1" onClick={() => setIsRegisterOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Log Safety Event Modal ────────────────────────────────────── */}
      <Modal
        isOpen={safetyTarget !== null}
        onClose={() => setSafetyTarget(null)}
        title={`Log Safety Event — ${safetyTarget?.name ?? ''}`}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`text-2xl font-black ${scoreColor(safetyTarget?.safety_score ?? 100)}`}>
            {safetyTarget?.safety_score ?? '—'}<span className="text-sm font-semibold text-gray-400">/100</span>
          </div>
          <div className="text-xs text-gray-500">Current Safety Score</div>
        </div>

        <form onSubmit={handleSafetySubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Event Type</label>
            <input
              type="text"
              value={safetyForm.event_type}
              onChange={e => setSafetyForm(f => ({ ...f, event_type: e.target.value }))}
              placeholder="e.g. Speeding violation / Safe driving bonus"
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500"
            />
            {safetyErrors.event_type && <p className="text-xs text-red-500">{safetyErrors.event_type}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Points <span className="text-gray-400 normal-case font-normal">(negative = penalty, positive = reward)</span>
            </label>
            <input
              type="number"
              value={safetyForm.points}
              onChange={e => setSafetyForm(f => ({ ...f, points: e.target.value }))}
              placeholder="e.g. -10 or +5"
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500"
            />
            {safetyErrors.points && <p className="text-xs text-red-500">{safetyErrors.points}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Notes (optional)</label>
            <textarea
              value={safetyForm.notes}
              onChange={e => setSafetyForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Exceeded 80 km/h zone on NH48"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Live preview of new score */}
          {safetyForm.points !== '' && !isNaN(parseInt(safetyForm.points)) && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm flex items-center gap-2">
              <span className="text-gray-500">New Score Preview:</span>
              <span className={`font-bold ${scoreColor(Math.max(0, Math.min(100, (safetyTarget?.safety_score ?? 0) + parseInt(safetyForm.points))))}`}>
                {Math.max(0, Math.min(100, (safetyTarget?.safety_score ?? 0) + parseInt(safetyForm.points)))} / 100
              </span>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmittingSafety}>
              {isSubmittingSafety ? 'Saving...' : 'Log Safety Event'}
            </Button>
            <Button variant="outline" type="button" className="flex-1" onClick={() => setSafetyTarget(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
