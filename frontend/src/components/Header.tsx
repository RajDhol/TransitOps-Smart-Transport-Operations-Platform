'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import { NAVIGATION_ITEMS } from '../constants/uiConfig';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Retrieve matching title from configuration path
  const currentItem = NAVIGATION_ITEMS.find((item) => item.href === pathname);
  const pageTitle = currentItem ? currentItem.name : 'TransitOps';

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 font-sans text-gray-900">
      {/* Dynamic Title */}
      <h1 className="text-xl font-semibold tracking-tight text-gray-900">{pageTitle}</h1>

      {/* Profile Actions */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm font-medium text-gray-700">{user.email}</p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-400 rounded transition-colors uppercase tracking-wider"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
