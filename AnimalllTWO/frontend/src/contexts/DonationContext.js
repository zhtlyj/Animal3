import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { donationsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const DonationContext = createContext();

export const useDonation = () => {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error('useDonation必须在DonationProvider内使用');
  return ctx;
};

export const DonationProvider = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      
      // 获取项目列表和统计信息（不需要认证）
      const [projectsRes, statsRes] = await Promise.all([
        donationsAPI.getProjects(),
        donationsAPI.getStats()
      ]);

      if (projectsRes.success) {
        setProjects(projectsRes.data.projects);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
      
      // 如果用户已登录，获取捐赠历史
      if (user) {
        try {
          const historyRes = await donationsAPI.getDonationHistory();
          if (historyRes.success) {
            setHistory(historyRes.data.donations);
          }
        } catch (error) {
          console.error('获取捐赠历史失败:', error);
        }
      }
    } catch (error) {
      console.error('刷新数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    refresh(); 
  }, [refresh]);

  const makeDonation = useCallback(async (donationData) => {
    try {
      const response = await donationsAPI.makeDonation(donationData);
      if (response.success) {
        await refresh();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('捐赠失败:', error);
      throw error;
    }
  }, [refresh]);

  const addProject = useCallback(async (projectData) => {
    try {
      const response = await donationsAPI.createProject(projectData);
      if (response.success) {
        await refresh();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }, [refresh]);

  const value = useMemo(() => ({ 
    projects, 
    history, 
    stats,
    loading,
    makeDonation, 
    addProject, 
    refresh 
  }), [projects, history, stats, loading, makeDonation, addProject, refresh]);

  return <DonationContext.Provider value={value}>{children}</DonationContext.Provider>;
};



