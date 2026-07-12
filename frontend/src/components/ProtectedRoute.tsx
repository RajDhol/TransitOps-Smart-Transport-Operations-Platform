'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { NAVIGATION_ITEMS } from '../constants/uiConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Check role-based permission for current route
  useEffect(() => {
    if (!loading && user && pathname !== '/login') {
      const currentItem = NAVIGATION_ITEMS.find((item) => item.href === pathname);
      if (currentItem && !currentItem.allowedRoles.includes(user.role)) {
        // Redirect to dashboard if they don't have access to this route
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-600 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
          <p className="text-sm font-medium">Loading TransitOps...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null; // Prevents flashing dashboard before redirecting
  }

  return <>{children}</>;
}
