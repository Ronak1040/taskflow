import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthService } from '../services/authService';
import type { User, RegisterPayload, LoginPayload, AuthContextType } from '../types/auth';
import type { ApiError } from '../types/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check persistent login session via GET /api/auth/me on app mount
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await AuthService.getMe();
      setUser(currentUser);
    } catch {
      // Unauthenticated session - perfectly normal for logged out users
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const login = async (payload: LoginPayload): Promise<void> => {
    setIsLoading(true);
    try {
      const loggedInUser = await AuthService.login(payload);
      setUser(loggedInUser);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<void> => {
    setIsLoading(true);
    try {
      const registeredUser = await AuthService.register(payload);
      setUser(registeredUser);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      console.warn('Logout request completed with notice:', apiErr.message);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
