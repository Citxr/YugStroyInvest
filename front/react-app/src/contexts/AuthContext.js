import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Настройка токена в localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Проверка токена при загрузке приложения
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          console.log('Проверка токена:', token);
          const userData = await authAPI.getCurrentUser();
          console.log('Пользователь найден:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Ошибка проверки токена:', error);
          console.error('Детали ошибки:', error.response?.data);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log('Попытка входа для пользователя:', username);
      const tokenData = await authAPI.login(username, password);
      console.log('Получен токен:', tokenData);
      
      const { access_token } = tokenData;
      setToken(access_token);
      localStorage.setItem('token', access_token);

      // Получаем информацию о пользователе
      console.log('Получение информации о пользователе...');
      const userData = await authAPI.getCurrentUser();
      console.log('Данные пользователя:', userData);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Ошибка входа:', error);
      console.error('Детали ошибки:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Ошибка входа' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return { success: true, data: response };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Ошибка регистрации' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const hasRole = (requiredRoles) => {
    if (!user) return false;
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    
    return user.role === requiredRoles;
  };

  const isAdmin = () => hasRole('admin');
  const isManager = () => hasRole('manager');
  const isEngineer = () => hasRole('engineer');
  const isClient = () => hasRole('client');

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isManager,
    isEngineer,
    isClient,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
