import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 用户身份类型
  const userTypes = {
    ALL_USERS: '游客',
    RESCUE_ORGANIZATION: '救助组织',
    ADOPTER: '领养人',
    DONOR: '捐赠者'
  };

  useEffect(() => {
    // 检查是否有token，如果有则获取用户信息
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.success) {
        setUser({
          ...response.data.user,
          stats: response.data.stats
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      // 如果token无效，清除本地存储
      authAPI.logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        setUser({
          ...response.data.user,
          stats: response.data.stats || {}
        });
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (userId, password, userType) => {
    try {
      const response = await authAPI.login({ userId, password, userType });
      if (response.success) {
        setUser({
          ...response.data.user,
          stats: response.data.stats
        });
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const response = await authAPI.updateUser(userData);
      if (response.success) {
        setUser({
          ...response.data.user,
          stats: response.data.stats
        });
        return { 
          success: true, 
          user: response.data.user,
          stats: response.data.stats
        };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userTypes,
    register,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

