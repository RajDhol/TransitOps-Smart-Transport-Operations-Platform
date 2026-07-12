'use client';

import React from 'react';

type BadgeColor = 'success' | 'warning' | 'error' | 'info' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

export default function Badge({
  children,
  color = 'gray',
  className = '',
}: BadgeProps) {
  const styles = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${styles[color]} ${className}`}>
      {children}
    </span>
  );
}
