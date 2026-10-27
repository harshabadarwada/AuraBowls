import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('auth_token') ? true : false;
  });

  const [role, setRole] = useState(() => localStorage.getItem('user_role') || 'guest');
  const [activePartnerId, setActivePartnerId] = useState(() => Number(localStorage.getItem('active_partner_id')) || 1);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('user_role', role);
  }, [role]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_profile');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('active_partner_id', activePartnerId);
  }, [activePartnerId]);

  const login = async (credentials) => {
    const res = await apiService.login(credentials);
    if (res && res.success) {
      localStorage.setItem('auth_token', res.token);
      setIsAuthenticated(true);
      setRole(res.role);
      setUser(res.user);
      if (res.active_partner_id) {
        setActivePartnerId(res.active_partner_id);
      }
      return { success: true, role: res.role };
    }
    return { success: false, error: res?.error || 'Login failed' };
  };

  const register = async (userData) => {
    const res = await apiService.register(userData);
    if (res && res.success) {
      localStorage.setItem('auth_token', res.token);
      setIsAuthenticated(true);
      setRole('customer');
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
    setRole('guest');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      role,
      setRole,
      activePartnerId,
      setActivePartnerId,
      user,
      setUser,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
