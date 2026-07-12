'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Sidebar from './Sidebar';
import Header from './Header';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <AuthProvider>
      <ProtectedRoute>
        {isLoginPage ? (
          <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {children}
          </main>
        ) : (
          <div className="flex h-screen w-screen bg-gray-50 overflow-hidden text-gray-900">
            {/* Navigation Panel */}
            <Sidebar />

            {/* Core Page Container */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-8">
                {children}
              </main>
            </div>
          </div>
        )}
      </ProtectedRoute>
    </AuthProvider>
  );
}
