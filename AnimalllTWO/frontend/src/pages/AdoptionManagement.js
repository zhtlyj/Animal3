import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnimals } from '../contexts/AnimalsContext';
import { animalsAPI } from '../services/api';
import BackButton from '../components/BackButton';

const AdoptionManagement = () => {
  const { user } = useAuth();
  const { loadAnimals, updateAnimal } = useAnimals();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // 从API获取申请数据
  useEffect(() => {
    const fetchApplications = async () => {
      if (user && user.userType === '救助组织') {
        setLoading(true);
        try {
          const response = await animalsAPI.getApplications();
          if (response.success) {
            setApplications(response.applications || []);
          } else {
            setMsg(response.error || '获取申请数据失败');
            setTimeout(() => setMsg(''), 3000);
          }
        } catch (error) {
          console.error('获取申请数据失败:', error);
          setMsg('获取申请数据失败，请重试');
          setTimeout(() => setMsg(''), 3000);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchApplications();
  }, [user]);

  const handleStatusChange = async (applicationId, newStatus) => {
    setLoading(true);
    try {
      const response = await animalsAPI.updateApplicationStatus(applicationId, newStatus);
      
      if (response.success) {
        // 更新申请列表
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: newStatus }
              : app
          )
        );
        
        // 如果申请被通过，需要更新动物状态并刷新列表
        if (newStatus === 'approved' && response.animal) {
          console.log('=== 申请已通过，开始更新动物状态 ===');
          console.log('返回的动物数据:', response.animal);
          console.log('返回的动物状态:', response.animal.status);
          console.log('返回的动物ID:', response.animal._id || response.animal.id);
          
          const animalId = response.animal._id || response.animal.id;
          
          // 直接更新本地状态
          if (animalId) {
            try {
              // 使用updateAnimal更新本地状态
              await updateAnimal(animalId, {
                status: '已领养',
                adopter: response.animal.adopter
              });
              console.log('✅ 本地动物状态已更新为已领养');
            } catch (error) {
              console.error('更新本地状态失败:', error);
            }
          }
          
          // 立即刷新动物列表
          console.log('第一次刷新动物列表...');
          await loadAnimals();
          
          // 等待数据库写入完成后再刷新
          setTimeout(async () => {
            console.log('第二次刷新动物列表...');
            await loadAnimals();
          }, 800);
          
          // 再次刷新确保数据完全同步
          setTimeout(async () => {
            console.log('第三次刷新动物列表...');
            await loadAnimals();
            console.log('✅ 动物列表刷新完成，请检查首页和领养中心');
          }, 2000);
        }
        
        setMsg(`申请状态已更新为${newStatus === 'approved' ? '已通过' : '已拒绝'}${newStatus === 'approved' ? '，动物状态已更新为已领养，请刷新首页查看' : ''}`);
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(response.error || '更新失败');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (error) {
      console.error('更新申请状态失败:', error);
      setMsg('更新失败，请重试');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="adoption-management-page">
        <div className="management-container">
          <div className="management-error">
            <h2>请先登录</h2>
            <p>您需要登录后才能访问申请管理</p>
          </div>
        </div>
      </div>
    );
  }

  if (user.userType !== '救助组织') {
    return (
      <div className="adoption-management-page">
        <div className="management-container">
          <div className="management-error">
            <h2>权限不足</h2>
            <p>只有救助组织才能访问申请管理</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adoption-management-page">
      <div className="management-header">
        <h1 className="management-title">申请管理</h1>
        <p className="management-subtitle">管理您发布的动物的领养申请</p>
      </div>

      <div className="management-main">
        <div className="management-container">
          {msg && (
            <div className={`management-message ${msg.includes('成功') ? 'success' : 'error'}`}>
              {msg}
            </div>
          )}

          <div className="management-section">
            <div className="section-header">
              <h2 className="section-title">📋 领养申请</h2>
              <div className="stats-summary">
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

            <div className="management-content">
              <div className="tab-navigation">
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
                    <p>当前没有{getStatusText(selectedTab)}的申请</p>
                  </div>
                ) : (
                  filteredApplications.map(application => (
                    <div key={application.id} className="application-card">
                      <div className="application-header">
                        <div className="animal-info">
                          <img 
                            src={application.animalImage} 
                            alt={application.animalName}
                            className="animal-thumbnail"
                          />
                          <div className="animal-details">
                            <h4 className="animal-name">{application.animalName}</h4>
                            <p className="animal-status">动物状态：{application.animalStatus}</p>
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
                        <div className="applicant-info">
                          <h5 className="applicant-name">申请人：{application.applicantName}</h5>
                          <div className="contact-info">
                            <span className="contact-item">📞 {application.applicantPhone}</span>
                            <span className="contact-item">📧 {application.applicantEmail}</span>
                          </div>
                          <p className="application-date">
                            申请时间：{new Date(application.applicationDate).toLocaleString()}
                          </p>
                        </div>

                        {application.message && (
                          <div className="application-message">
                            <h6>申请说明：</h6>
                            <p>{application.message}</p>
                          </div>
                        )}

                        {application.status === 'pending' && (
                          <div className="application-actions">
                            <button 
                              className="action-btn approve-btn"
                              onClick={() => handleStatusChange(application.id, 'approved')}
                              disabled={loading}
                            >
                              <span className="btn-icon">✅</span>
                              通过申请
                            </button>
                            <button 
                              className="action-btn reject-btn"
                              onClick={() => handleStatusChange(application.id, 'rejected')}
                              disabled={loading}
                            >
                              <span className="btn-icon">❌</span>
                              拒绝申请
                            </button>
                          </div>
                        )}

                        {application.status === 'approved' && (
                          <div className="approved-info">
                            <span className="approved-icon">🎉</span>
                            <span className="approved-text">申请已通过，请及时联系申请人</span>
                          </div>
                        )}

                        {application.status === 'rejected' && (
                          <div className="rejected-info">
                            <span className="rejected-icon">😔</span>
                            <span className="rejected-text">申请已拒绝</span>
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

export default AdoptionManagement;
