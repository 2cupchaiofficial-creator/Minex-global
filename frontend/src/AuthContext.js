import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await userAPI.getProfile();
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (tokenOrEmail, passwordOrUser) => {
    // Check if this is a direct login (token + user object) or email/password login
    if (typeof passwordOrUser === 'object' && passwordOrUser !== null) {
      // Direct login with token and user object (used by admin impersonation)
      localStorage.setItem('token', tokenOrEmail);
      setUser(passwordOrUser);
      return { token: tokenOrEmail, user: passwordOrUser };
    } else {
      // Normal email/password login
      const response = await authAPI.login({ email: tokenOrEmail, password: passwordOrUser });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return response.data;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
