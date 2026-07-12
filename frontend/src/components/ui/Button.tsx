'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyle = 'inline-flex items-center justify-center font-bold rounded transition-colors uppercase tracking-wider select-none outline-none border focus:ring-1 focus:ring-offset-1';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 focus:ring-gray-300',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 focus:ring-red-400',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-700 focus:ring-green-500',
    outline: 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-400 focus:ring-gray-350',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
