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

    if (!email) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, role);
    setIsSubmitting(false);

    if (!success) {
      setError('Login failed. Please check credentials.');
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 p-8 font-sans rounded-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to TransitOps</h2>
        <p className="text-sm text-gray-500 mt-1">Smart Transport Operations Platform</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded">
            {error}
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
            className="w-full px-3 py-2 border border-gray-200 focus:border-indigo-500 outline-none text-sm transition-colors rounded"
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
            className="w-full px-3 py-2 border border-gray-200 focus:border-indigo-500 outline-none text-sm transition-colors rounded"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Active Role (For Testing RBAC)
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
  );
}
