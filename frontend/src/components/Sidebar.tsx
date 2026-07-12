'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { NAVIGATION_ITEMS } from '../constants/uiConfig';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  // Filter items matching user's role
  const visibleNavItems = NAVIGATION_ITEMS.filter((item) =>
    item.allowedRoles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-full font-sans text-gray-900">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            Transit<span className="text-indigo-600 font-black">Ops</span>
          </span>
          <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded border border-indigo-100 font-semibold uppercase">
            v1.0
          </span>
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Profile Summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-1">
        <p className="text-sm font-semibold truncate text-gray-800">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        <div className="mt-2 inline-flex items-center w-fit bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
          {user.role}
        </div>
      </div>
    </aside>
  );
}
