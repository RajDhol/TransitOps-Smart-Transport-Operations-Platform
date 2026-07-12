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
import Pagination from '../../components/ui/Pagination';

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Reset page number when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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

  // --- Renew License Modal ---
  const [renewTarget, setRenewTarget] = useState<Driver | null>(null);
  const [renewDate, setRenewDate] = useState('');
  const [renewError, setRenewError] = useState('');
  const [isSubmittingRenew, setIsSubmittingRenew] = useState(false);

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

    // 1. Name validation
    const trimmedName = registerForm.name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 3) {
      errors.name = 'Name must be at least 3 characters long.';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      errors.name = 'Name can only contain letters and spaces.';
    }

    // 2. License Number validation
    const trimmedLicense = registerForm.license_number.trim();
    if (!trimmedLicense) {
      errors.license_number = 'License number is required.';
    } else if (trimmedLicense.length < 5 || trimmedLicense.length > 25) {
      errors.license_number = 'License number must be between 5 and 25 characters.';
    } else if (!/^[A-Z0-9-\s]+$/i.test(trimmedLicense)) {
      errors.license_number = 'License number must be alphanumeric (dashes/spaces allowed).';
    }

    // 3. Contact Number validation
    const trimmedContact = registerForm.contact_number.trim();
    if (!trimmedContact) {
      errors.contact_number = 'Contact number is required.';
    } else if (!/^\+?[\d\s-]{10,15}$/.test(trimmedContact)) {
      errors.contact_number = 'Enter a valid phone number (10 to 15 digits).';
    }

    // 4. Expiry Date validation
    if (!registerForm.license_expiry_date) {
      errors.license_expiry_date = 'Expiry date is required.';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(registerForm.license_expiry_date);
      if (expiry <= today) {
        errors.license_expiry_date = 'License has already expired. Expiry date must be in the future.';
      }
    }

    // 5. Safety Score validation
    const score = parseInt(registerForm.safety_score);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.safety_score = 'Safety score must be between 0 and 100.';
    }

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }
    setRegisterErrors({});
    setIsRegistering(true);

    try {
      const res = await fetch('http://localhost:8000/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          license_number: trimmedLicense.toUpperCase(),
          license_category: registerForm.license_category,
          license_expiry_date: registerForm.license_expiry_date,
          contact_number: trimmedContact,
          safety_score: score,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Map backend unique license check error to the input field
        if (data.detail && data.detail.includes('exists')) {
          setRegisterErrors({ license_number: data.detail });
          return;
        }
        throw new Error(data.detail || 'Registration failed.');
      }

      showNotification('success', `Driver "${trimmedName}" registered successfully.`);
      setIsRegisterOpen(false);
      setRegisterForm({
        name: '',
        license_number: '',
        license_category: 'Class A CDL',
        license_expiry_date: '',
        contact_number: '',
        safety_score: '100'
      });
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

  // ---- Renew License -------------------------------------------------------
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewDate) {
      setRenewError('Please select a valid expiry date.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(renewDate);
    if (selected <= today) {
      setRenewError('Expiry date must be in the future.');
      return;
    }

    setRenewError('');
    setIsSubmittingRenew(true);
    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${renewTarget!.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_expiry_date: renewDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Renewal failed.');

      showNotification('success', `License for ${renewTarget!.name} renewed successfully to ${renewDate}.`);
      setRenewTarget(null);
      setRenewDate('');
      fetchDrivers();
    } catch (err: any) {
      setRenewError(err.message);
    } finally {
      setIsSubmittingRenew(false);
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

      // Refresh driver list to update status if auto-suspended
      fetchDrivers();

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

  // Helper to check if a license is expired
  const isLicenseExpired = (expiryDateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(expiryDateStr);
      return expiry <= today;
    } catch {
      return true;
    }
  };

  // Helper to format today's date for datepicker constraint
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to calculate and display warning tags for expired or expiring licenses
  const getExpiryWarning = (expiryDateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(expiryDateStr);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        return <span className="text-[10px] font-bold text-red-600 block mt-0.5">Expired</span>;
      } else if (diffDays <= 30) {
        return <span className="text-[10px] font-bold text-amber-600 block mt-0.5">Expiring in {diffDays}d</span>;
      }
    } catch {
      return null;
    }
    return null;
  };

  // ---- Filter --------------------------------------------------------------
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.license_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              ) : paginatedDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400 text-sm">
                    No drivers found matching search or filters.
                  </td>
                </tr>
              ) : paginatedDrivers.map(d => (
                <tr key={d.id} className="text-gray-700">
                  <td className="py-3 font-semibold">#{d.id}</td>
                  <td className="py-3 font-semibold">{d.name}</td>
                  <td className="py-3 font-mono text-xs">{d.license_number}</td>
                  <td className="py-3">{d.license_category}</td>
                  <td className="py-3 font-medium">
                    {d.license_expiry_date}
                    {getExpiryWarning(d.license_expiry_date)}
                  </td>
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
                    {d.status === 'On Trip' ? (
                      <span
                        title="Cannot suspend — driver is currently On Trip"
                        className="text-[10px] font-bold px-2 py-1 rounded border border-amber-200 text-amber-600 bg-amber-50 cursor-not-allowed"
                      >
                        On Trip
                      </span>
                    ) : d.status !== 'Suspended' ? (
                      <Button variant="outline" size="sm" onClick={() => handleSuspend(d)}>
                        Suspend
                      </Button>
                    ) : isLicenseExpired(d.license_expiry_date) ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 border-none"
                        onClick={() => {
                          setRenewTarget(d);
                          setRenewDate('');
                          setRenewError('');
                        }}
                      >
                        Renew License
                      </Button>
                    ) : d.safety_score < 70 ? (
                      <Button
                        variant="success"
                        size="sm"
                        disabled
                        className="opacity-50 cursor-not-allowed"
                        title="Cannot activate — safety score is too low (< 70). Log positive safety events first."
                      >
                        Activate (Low Score)
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredDrivers.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
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
              min={getTodayString()}
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
      {/* ── Renew License Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={renewTarget !== null}
        onClose={() => setRenewTarget(null)}
        title={`Renew License — ${renewTarget?.name ?? ''}`}
      >
        <p className="text-sm text-gray-500 mb-4">
          Select a new future expiry date to renew the driver's license. If safety score is healthy (≥ 70), the driver will be automatically activated.
        </p>

        <form onSubmit={handleRenewSubmit} className="space-y-4">
          {renewError && (
            <p className="text-xs font-semibold text-red-600">{renewError}</p>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">New Expiry Date</label>
            <input
              type="date"
              min={getTodayString()}
              value={renewDate}
              onChange={e => setRenewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 text-sm rounded outline-none focus:border-indigo-500 bg-white"
              required
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmittingRenew}>
              {isSubmittingRenew ? 'Renewing...' : 'Renew & Activate'}
            </Button>
            <Button variant="outline" type="button" className="flex-1" onClick={() => setRenewTarget(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
