import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('heartsense_user');
    const token = localStorage.getItem('heartsense_access_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('heartsense_access_token', access);
      localStorage.setItem('heartsense_refresh_token', refresh);
      localStorage.setItem('heartsense_user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail || 
                      error.response?.data?.non_field_errors?.[0] || 
                      "Authentication failed. Please verify your credentials.";
      return { success: false, error: message };
    }
  };

  const register = async (formData) => {
    try {
      const response = await api.post('/auth/register/', formData);
      return { success: true, data: response.data };
    } catch (error) {
      const data = error.response?.data;
      let errorMsg = "Registration failed. Please check form inputs.";
      if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          errorMsg = `${firstKey}: ${Array.isArray(val) ? val[0] : val}`;
        }
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('heartsense_access_token');
    localStorage.removeItem('heartsense_refresh_token');
    localStorage.removeItem('heartsense_user');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setUser(res.data);
      localStorage.setItem('heartsense_user', JSON.stringify(res.data));
    } catch (e) {
      console.error("Failed to refresh profile", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ? user.role.toLowerCase() : null,
        rawRole: user?.role,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
