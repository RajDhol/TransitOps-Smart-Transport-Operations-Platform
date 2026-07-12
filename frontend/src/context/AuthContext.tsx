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
  login: (email: string, role: UserRole) => Promise<boolean>;
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

  const login = async (email: string, role: UserRole): Promise<boolean> => {
    setLoading(true);
    // Simulate API call for login (in real app, post to /api/auth/login)
    try {
      const mockUser: User = {
        id: Math.floor(Math.random() * 1000),
        name: `${role} User`,
        email: email,
        role: role,
      };
      const mockToken = 'mock_jwt_token_for_' + role;

      localStorage.setItem('transitops_user', JSON.stringify(mockUser));
      localStorage.setItem('transitops_token', mockToken);

      setUser(mockUser);
      setToken(mockToken);
      setLoading(false);
      router.push('/');
      return true;
    } catch (e) {
      console.error(e);
      setLoading(false);
      return false;
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
