'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '../constants/uiConfig';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Load auth from localStorage on mount
    const savedUser = localStorage.getItem('transitops_user');
    const savedToken = localStorage.getItem('transitops_token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }), // <--- Passing the role
      });
      if (!res.ok) {
        // Handle HTTP error (e.g. 403 or 401)
        const errorData = await res.json().catch(() => null);
        setLoading(false);
        return { success: false, error: errorData?.detail || 'Invalid credentials or authentication error.' };
      }
      const data = await res.json();

      // Store in localStorage
      localStorage.setItem('transitops_user', JSON.stringify(data.user));
      localStorage.setItem('transitops_token', data.token);
      setUser(data.user);
      setToken(data.token);
      setLoading(false);
      router.push('/');
      return { success: true };
    } catch (e) {
      setLoading(false);
      return { success: false, error: 'Server connection error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('transitops_user');
    localStorage.removeItem('transitops_token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
