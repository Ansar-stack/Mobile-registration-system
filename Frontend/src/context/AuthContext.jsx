import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.verify()
      .then((res) => setUser(res.data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    await authService.login(email, password);
    const res = await authService.verify();
    const loggedInUser = res.data.data.user;
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
