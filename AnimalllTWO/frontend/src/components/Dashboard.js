import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">欢迎，{user?.userId}</h1>
        <p className="auth-subtitle">您已成功登录动物保护公益与领养平台</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          background: '#f7fafc', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            color: '#2d3748', 
            marginBottom: '15px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            用户信息
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#718096', fontWeight: '500' }}>用户ID:</span>
              <span style={{ color: '#2d3748' }}>{user?.userId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#718096', fontWeight: '500' }}>身份类型:</span>
              <span style={{ color: '#2d3748' }}>{user?.userType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#718096', fontWeight: '500' }}>邮箱:</span>
              <span style={{ color: '#2d3748' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#718096', fontWeight: '500' }}>电话:</span>
              <span style={{ color: '#2d3748' }}>{user?.phone}</span>
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#e6fffa', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #b2f5ea'
        }}>
          <h3 style={{ 
            color: '#234e52', 
            marginBottom: '15px',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            平台功能
          </h3>
          <p style={{ color: '#2c7a7b', lineHeight: '1.6' }}>
            根据您的身份类型 <strong>{user?.userType}</strong>，您可以：
          </p>
          <ul style={{ 
            color: '#2c7a7b', 
            marginTop: '10px',
            paddingLeft: '20px',
            lineHeight: '1.6'
          }}>
            {user?.userType === '救助组织' && (
              <>
                <li>发布动物救助信息</li>
                <li>管理救助动物档案</li>
                <li>接收捐赠和志愿者申请</li>
              </>
            )}
            {user?.userType === '领养人' && (
              <>
                <li>浏览可领养动物信息</li>
                <li>提交领养申请</li>
                <li>查看领养进度</li>
              </>
            )}
            {user?.userType === '捐赠者' && (
              <>
                <li>查看救助项目</li>
                <li>进行爱心捐赠</li>
                <li>跟踪捐赠使用情况</li>
              </>
            )}
            {user?.userType === '游客' && (
              <>
                <li>浏览平台所有功能</li>
                <li>参与公益活动</li>
                <li>分享动物保护信息</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="auth-button"
        style={{ 
          background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
          width: '100%'
        }}
      >
        退出登录
      </button>
    </div>
  );
};

export default Dashboard;

