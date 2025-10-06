
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-login for development (remove in production)
  useEffect(() => {
    let isMounted = true;
    
    const autoLogin = async () => {
      try {
        console.log('Attempting auto-login...');
        
        // For development, set user directly to avoid API timeout issues
        if (isMounted) {
          const mockUser = {
            id: 'mock-user',
            name: 'Mock User',
            email: 'admin@sooner.cap',
            role: {
              name: 'Administrator',
              id: 'admin-role'
            }
          };
          console.log('Auto-login successful (mock):', mockUser);
          setUser(mockUser);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Auto-login failed:', error);
          console.log('User will need to login manually');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    autoLogin();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const response = await api.login({ email, password });
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setLoading(false);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
