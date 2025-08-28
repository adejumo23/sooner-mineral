
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
    const autoLogin = async () => {
      try {
        // Auto-login with a default user for development
        const userData = await api.login('admin@sooner.cap', 'password');
        setUser(userData);
      } catch (error) {
        console.log('Auto-login failed, user will need to login manually');
      } finally {
        setLoading(false);
      }
    };
    
    autoLogin();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const userData = await api.login(email, password);
      setUser(userData);
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
