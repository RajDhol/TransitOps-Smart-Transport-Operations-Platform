'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import { NAVIGATION_ITEMS } from '../constants/uiConfig';

// Dynamic page description map
const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/': 'Monitor real-time fleet operations, KPIs, and utilization metrics.',
  '/vehicles': 'Manage fleet assets, track mileage, monitor maintenance status, and register new vehicles.',
  '/drivers': 'Track driver logs, monitor safety scores, license categories, and compliance status.',
  '/trips': 'Dispatch new trips, assign drivers, check cargo weight capacity, and complete active routes.',
  '/maintenance': 'Log maintenance tickets, set vehicle status to In Shop, and complete repairs.',
  '/expenses': 'Log refueling transactions, tolls, operational costs, and total fleet expenditures.',
  '/reports': 'Evaluate fleet performance metrics, calculate individual vehicle ROI, track fuel efficiency ratios, and export reports.',
  '/settings': 'Manage general depot configurations and inspect role-based system access permissions.',
};

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  // Retrieve matching title from configuration path
  const currentItem = NAVIGATION_ITEMS.find((item) => item.href === pathname);
  const pageTitle = currentItem ? currentItem.name : 'TransitOps';
  const pageDescription = PAGE_DESCRIPTIONS[pathname] || 'Smart Transport Operations Platform';

  return (
    <header className="h-20 border-b border-gray-200 bg-white flex items-center justify-between px-8 font-sans text-gray-900">
      {/* Dynamic Title and Subtitle */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{pageDescription}</p>
      </div>

      {/* Profile Actions */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm font-semibold text-gray-700">{user.email}</p>
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
