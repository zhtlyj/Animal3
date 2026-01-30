import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { animalsAPI } from '../services/api';
import BackButton from '../components/BackButton';
import './MyAdoptions.css';

const MyAdoptions = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  // 从API获取申请数据
  const fetchApplications = async () => {
    if (!user) {
      console.log('用户未登录');
      return;
    }
    
    if (user.userType !== '领养人') {
      console.log('用户类型不是领养人:', user.userType);
      return;
    }

    setLoading(true);
    setMsg('');
    
    try {
      console.log('开始获取我的申请');
      console.log('用户信息:', user);
      console.log('用户ID:', user._id || user.id);
      console.log('用户类型:', user.userType);
      const response = await animalsAPI.getMyApplications();
      console.log('API完整响应:', JSON.stringify(response, null, 2));
      
      if (response) {
        if (response.success) {
          const apps = response.applications || [];
          console.log('获取到的申请数量:', apps.length);
          console.log('申请数据:', apps);
          setApplications(apps);
          
          if (apps.length === 0) {
            setMsg(response.message || '您还没有提交任何领养申请');
          } else {
            setMsg('');
          }
        } else {
          const errorMsg = response.error || response.message || '获取申请数据失败';
          console.error('API返回错误:', errorMsg);
          setMsg(errorMsg);
          setApplications([]);
        }
      } else {
        console.error('API返回空响应');
        setMsg('服务器未返回数据，请稍后重试');
        setApplications([]);
      }
    } catch (error) {
      console.error('获取申请数据异常:', error);
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      
      // 检查是否是网络错误
      if (error.message && error.message.includes('fetch')) {
        setMsg('网络连接失败，请检查后端服务器是否运行');
      } else {
        setMsg(error.message || '获取申请数据失败，请检查网络连接或稍后重试');
      }
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const getStatusText = (status) => {
    const statusMap = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝'
    };
    return statusMap[status] || '未知';
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  };

  const filteredApplications = applications.filter(app => {
    if (selectedTab === 'pending') return app.status === 'pending';
    if (selectedTab === 'approved') return app.status === 'approved';
    if (selectedTab === 'rejected') return app.status === 'rejected';
    return true;
  });

  if (!user) {
    return (
      <div className="my-adoptions-page">
        <div className="adoptions-container">
          <div className="adoptions-error">
            <h2>请先登录</h2>
            <p>您需要登录后才能查看申请记录</p>
          </div>
        </div>
      </div>
    );
  }

  if (user.userType !== '领养人') {
    return (
      <div className="my-adoptions-page">
        <div className="adoptions-container">
          <div className="adoptions-error">
            <h2>权限不足</h2>
            <p>只有领养人可以查看申请记录</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-adoptions-page">
      <div className="adoptions-header">
        <h1 className="adoptions-title">我的申请</h1>
        <p className="adoptions-subtitle">查看您提交的所有领养申请记录</p>
      </div>

      <div className="adoptions-main">
        <div className="adoptions-container">
          {msg && (
            <div className={`adoptions-message ${msg.includes('成功') || msg.includes('还没有') ? 'info' : 'error'}`}>
              {msg}
              {msg.includes('失败') && (
                <button 
                  className="retry-btn" 
                  onClick={fetchApplications}
                  style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
                >
                  重试
                </button>
              )}
            </div>
          )}

          <div className="adoptions-section">
            <div className="section-header">
              <h2 className="section-title">📋 领养申请记录</h2>
              <div className="stats-summary">
                <div className="stat-item">
                  <span className="stat-number">{applications.length}</span>
                  <span className="stat-label">总申请</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{applications.filter(app => app.status === 'pending').length}</span>
                  <span className="stat-label">待审核</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{applications.filter(app => app.status === 'approved').length}</span>
                  <span className="stat-label">已通过</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{applications.filter(app => app.status === 'rejected').length}</span>
                  <span className="stat-label">已拒绝</span>
                </div>
              </div>
            </div>

            <div className="adoptions-content">
              <div className="tab-navigation">
                <button 
                  className={`tab-button ${selectedTab === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('all')}
                >
                  <span className="tab-icon">📋</span>
                  全部 ({applications.length})
                </button>
                <button 
                  className={`tab-button ${selectedTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('pending')}
                >
                  <span className="tab-icon">⏳</span>
                  待审核 ({applications.filter(app => app.status === 'pending').length})
                </button>
                <button 
                  className={`tab-button ${selectedTab === 'approved' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('approved')}
                >
                  <span className="tab-icon">✅</span>
                  已通过 ({applications.filter(app => app.status === 'approved').length})
                </button>
                <button 
                  className={`tab-button ${selectedTab === 'rejected' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('rejected')}
                >
                  <span className="tab-icon">❌</span>
                  已拒绝 ({applications.filter(app => app.status === 'rejected').length})
                </button>
              </div>

              <div className="applications-list">
                {loading ? (
                  <div className="empty-state">
                    <div className="empty-icon">⏳</div>
                    <h3>加载中...</h3>
                    <p>正在获取申请数据</p>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>暂无申请</h3>
                    <p>当前没有{selectedTab === 'all' ? '' : getStatusText(selectedTab)}的申请记录</p>
                    <button 
                      className="refresh-btn"
                      onClick={fetchApplications}
                      style={{ 
                        marginTop: '20px', 
                        padding: '10px 20px', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      🔄 刷新
                    </button>
                  </div>
                ) : (
                  filteredApplications.map((application, index) => (
                    <div key={application.id || `app-${index}`} className="application-card">
                      <div className="application-header">
                        <div className="animal-info">
                          <img 
                            src={application.animalImage || 'https://via.placeholder.com/100x100?text=No+Image'} 
                            alt={application.animalName || '动物'}
                            className="animal-thumbnail"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                            }}
                          />
                          <div className="animal-details">
                            <h4 className="animal-name">{application.animalName || '未知动物'}</h4>
                            <p className="animal-species">种类：{application.animalSpecies || '未知'}</p>
                            <p className="animal-status">动物状态：{application.animalStatus || '未知'}</p>
                            <p className="animal-location">📍 {application.animalCity || '未知地区'}</p>
                          </div>
                        </div>
                        <div className="application-status">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(application.status) }}
                          >
                            {getStatusText(application.status)}
                          </span>
                        </div>
                      </div>

                      <div className="application-content">
                        <div className="application-info">
                          <p className="application-date">
                            <span className="info-label">申请时间：</span>
                            {application.applicationDate 
                              ? new Date(application.applicationDate).toLocaleString('zh-CN')
                              : '未知'
                            }
                          </p>
                          {application.message && (
                            <div className="application-message">
                              <h6>申请说明：</h6>
                              <p>{application.message}</p>
                            </div>
                          )}
                          {application.publisherName && (
                            <p className="publisher-info">
                              <span className="info-label">发布组织：</span>
                              {application.publisherName}
                            </p>
                          )}
                        </div>

                        {application.status === 'pending' && (
                          <div className="pending-info">
                            <span className="pending-icon">⏳</span>
                            <span className="pending-text">申请已提交，等待救助组织审核</span>
                          </div>
                        )}

                        {application.status === 'approved' && (
                          <div className="approved-info">
                            <span className="approved-icon">🎉</span>
                            <span className="approved-text">恭喜！您的申请已通过，请及时联系救助组织</span>
                          </div>
                        )}

                        {application.status === 'rejected' && (
                          <div className="rejected-info">
                            <span className="rejected-icon">😔</span>
                            <span className="rejected-text">很遗憾，您的申请未通过审核</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <BackButton />
    </div>
  );
};

export default MyAdoptions;
