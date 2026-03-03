import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getProfile,
  getTokens,
} from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const tokens = await getTokens();
      if (tokens?.access) {
        const profile = await getProfile();
        setUser(profile);
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    await apiLogin(email, password);
    const profile = await getProfile();
    setUser(profile);
    setIsAuthenticated(true);
    return profile;
  };

  const register = async ({ email, password, first_name, last_name }) => {
    await apiRegister({ email, password, first_name, last_name });
    await apiLogin(email, password);
    const profile = await getProfile();
    setUser(profile);
    setIsAuthenticated(true);
    return profile;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
      return profile;
    } catch {
      return null;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
