'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 border border-gray-200 focus:border-indigo-500 bg-white outline-none text-sm transition-colors rounded ${
          error ? 'border-red-300 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[11px] font-semibold text-red-600 mt-1">{error}</span>}
    </div>
  );
}
