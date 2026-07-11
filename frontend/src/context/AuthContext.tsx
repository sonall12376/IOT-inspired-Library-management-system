import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'librarian' | 'admin';
  dailyBookingCount: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string | undefined>;
  resetPassword: (token: string, password: string) => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadProfile = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data.user);
        } catch (err: any) {
          console.error('Failed to load user profile on mount:', err);
          handleLogoutLocal();
        }
      }
      setIsLoading(false);
    };

    loadProfile();

    // Listen to session expiration events from axios interceptor
    const handleSessionExpired = () => {
      handleLogoutLocal();
      setError('Your session has expired. Please sign in again.');
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  const handleLogoutLocal = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setToken(null);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: accessToken, refreshToken, user: userData } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(userData);
      setToken(accessToken);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', { name, email, password });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('Backend logout failed or token already invalid', err);
    } finally {
      handleLogoutLocal();
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<string | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data.resetToken;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to request password reset.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (tokenStr: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/auth/reset-password/${tokenStr}`, { password });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
