
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import type { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log('Loaded user from localStorage:', parsedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }
    // No user in localStorage - user will need to login
    // This ensures the login screen is shown
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const response = await api.login({ email, password });
      if (response.user) {
        setUser(response.user);
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('Login successful, user saved:', response.user);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setLoading(false);
  };

  const refreshUser = (updatedUser: User) => {
    // Ensure role object is complete
    const userWithCompleteRole = {
      ...updatedUser,
      role: {
        id: updatedUser.role.id,
        name: updatedUser.role.name,
        description: updatedUser.role.description || ''
      }
    };
    setUser(userWithCompleteRole);
    localStorage.setItem('user', JSON.stringify(userWithCompleteRole));
    console.log('User refreshed in auth context:', userWithCompleteRole);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refreshUser,
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
