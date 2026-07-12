'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'white' | 'gray' | 'indigo';
  className?: string;
}

export default function Card({
  children,
  title,
  subtitle,
  headerActions,
  footer,
  variant = 'white',
  className = '',
}: CardProps) {
  const bgColors = {
    white: 'bg-white border-gray-200',
    gray: 'bg-gray-50 border-gray-200',
    indigo: 'bg-indigo-900 text-white border-indigo-950',
  };

  return (
    <div className={`border p-6 rounded-md flex flex-col gap-4 font-sans ${bgColors[variant]} ${className}`}>
      {/* Card Header */}
      {(title || subtitle || headerActions) && (
        <div className="flex justify-between items-start border-b border-inherit pb-4">
          <div className="flex flex-col gap-0.5">
            {title && <h3 className="text-lg font-bold tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className="flex-1">{children}</div>

      {/* Card Footer */}
      {footer && <div className="border-t border-inherit pt-4 mt-2">{footer}</div>}
    </div>
  );
}
