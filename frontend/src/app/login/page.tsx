'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES, UserRole } from '../../constants/uiConfig';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Fleet Manager');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs client-side
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await login(email, role);
      if (!success) {
        setError('Invalid credentials or authentication error.');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Column 1: Branding and Details */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-900 text-white flex-col justify-between p-12 border-r border-indigo-950">
        <div>
          <span className="text-3xl font-bold tracking-tight text-indigo-200">
            Transit<span className="text-white font-black">Ops</span>
          </span>
        </div>

        <div className="space-y-6 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Smart Transport Operations Platform
          </h1>
          <p className="text-indigo-200 text-base leading-relaxed">
            A centralized hub to digitize your complete fleet lifecycle—managing vehicles, drivers, dispatch schedules, active maintenance logs, and fuel tracking in real-time.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="border border-indigo-800 bg-indigo-950/40 p-4 rounded">
              <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Compliance</p>
              <p className="text-sm text-white mt-1">Driver license tracking & safety ratings.</p>
            </div>
            <div className="border border-indigo-800 bg-indigo-950/40 p-4 rounded">
              <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Efficiency</p>
              <p className="text-sm text-white mt-1">Automated dispatch limit checks.</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-indigo-300 border-t border-indigo-850 pt-4 flex justify-between items-center">
          <span>Active Session Security: WSS/TLS Encrypted</span>
          <span>© 2026 TransitOps</span>
        </div>
      </div>

      {/* Column 2: Login Interface */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <div className="md:hidden mb-4">
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                Transit<span className="text-indigo-600 font-black">Ops</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your credentials below to access the platform.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message Panel */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded flex items-start gap-2.5">
                <span className="text-red-500 font-bold text-sm leading-none">!</span>
                <div>
                  <p className="font-semibold">Authentication Alert</p>
                  <p className="mt-0.5 text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. manager@transitops.com"
                className="w-full px-3 py-2 border border-gray-200 focus:border-indigo-500 outline-none text-sm transition-colors rounded bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-200 focus:border-indigo-500 outline-none text-sm transition-colors rounded bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Assign System Role (Mock Login)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-indigo-500 outline-none text-sm transition-colors rounded"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded transition-colors uppercase tracking-wider mt-4"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
