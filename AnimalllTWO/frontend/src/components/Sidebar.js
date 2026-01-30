import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from './Toast';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleAdoptClick = () => {
    navigate('/adoption');
  };

  const handleFavoritesClick = () => {
    if (!user) {
      showToast('请先登录后再查看收藏', 'warning');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    
    // 跳转到收藏页面
    navigate('/favorites');
  };

  const handleGuideClick = () => {
    navigate('/guide');
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-card">
          <h3>领养中心</h3>
          <p>浏览可领养的动物卡片信息。</p>
          <button className="sidebar-btn" onClick={handleAdoptClick}>去领养</button>
        </div>
        <div className="sidebar-card">
          <h3>我的收藏</h3>
          <p>查看您收藏的可爱动物们。</p>
          <button className="sidebar-btn" onClick={handleFavoritesClick}>查看收藏</button>
        </div>
        <div className="sidebar-card">
          <h3>科普与指南</h3>
          <p>领养流程、照护知识与适应指南。</p>
          <button className="sidebar-btn" onClick={handleGuideClick}>查看指南</button>
        </div>
      </aside>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default Sidebar;



