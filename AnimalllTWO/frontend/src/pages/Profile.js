import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    userType: '',
    email: '',
    phone: '',
    organization: '',
    address: ''
  });
  const [stats, setStats] = useState({
    registrationDays: 0,
    publishedAnimals: 0,
    successfulAdoptions: 0,
    adoptionApplications: 0,
    donationCount: 0
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        userId: user.userId || '',
        userType: user.userType || '',
        email: user.email || '',
        phone: user.phone || '',
        organization: user.organization || '',
        address: user.address || ''
      });
      // 设置头像预览
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
      // 设置统计数据
      if (user.stats) {
        setStats(user.stats);
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理头像上传
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setMsg('请选择图片文件');
        setTimeout(() => setMsg(''), 3000);
        return;
      }
      
      // 检查文件大小（限制2MB）
      if (file.size > 2 * 1024 * 1024) {
        setMsg('图片大小不能超过2MB');
        setTimeout(() => setMsg(''), 3000);
        return;
      }

      setAvatar(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 触发文件选择
  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  // 移除头像
  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMsg('');
      
      // 准备更新数据，过滤空字符串
      const updateData = { ...formData };
      
      // 过滤空字符串，避免后端验证错误
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === '') {
          updateData[key] = undefined;
        }
      });
      
      // 如果有新头像，转换为base64
      if (avatar) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          updateData.avatar = e.target.result;
          const result = await updateUser(updateData);
          if (result.success) {
            setMsg('个人信息更新成功！');
            setIsEditing(false);
            setAvatar(null); // 清除临时头像文件
            // 更新统计数据
            if (result.stats) {
              setStats(result.stats);
            }
          } else {
            setMsg(result.error || '更新失败，请重试');
          }
          setLoading(false);
          setTimeout(() => setMsg(''), 3000);
        };
        reader.readAsDataURL(avatar);
      } else {
        // 没有新头像，直接更新其他信息
        const result = await updateUser(updateData);
        if (result.success) {
          setMsg('个人信息更新成功！');
          setIsEditing(false);
          // 更新统计数据
          if (result.stats) {
            setStats(result.stats);
          }
        } else {
          setMsg(result.error || '更新失败，请重试');
        }
        setLoading(false);
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (error) {
      setMsg('更新失败，请重试');
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      userId: user.userId || '',
      userType: user.userType || '',
      email: user.email || '',
      phone: user.phone || '',
        organization: user.organization || '',
        address: user.address || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-error">
            <h2>请先登录</h2>
            <p>您需要登录后才能查看个人信息</p>
            <button className="profile-btn" onClick={() => navigate('/login')}>
              去登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">个人信息</h1>
        <p className="profile-subtitle">管理您的个人资料和账户设置</p>
      </div>

      <div className="profile-main">
        <div className="profile-container">
          {msg && (
            <div className={`profile-message ${msg.includes('成功') ? 'success' : 'error'}`}>
              {msg}
            </div>
          )}

          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">👤 基本信息</h2>
              <div className="section-actions">
                {!isEditing ? (
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>
                    <span className="btn-icon">✏️</span>
                    编辑
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button className="save-btn" onClick={handleSave} disabled={loading}>
                      <span className="btn-icon">{loading ? '⏳' : '💾'}</span>
                      {loading ? '保存中...' : '保存'}
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      <span className="btn-icon">❌</span>
                      取消
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="profile-content">
              <div className="profile-avatar-section">
                <div className="avatar-container">
                  <div className="profile-avatar" onClick={isEditing ? triggerAvatarUpload : undefined}>
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="用户头像" 
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.userType === '救助组织' ? '🏥' : '👤'}
                      </div>
                    )}
                    {isEditing && (
                      <div className="avatar-overlay">
                        <span className="avatar-upload-icon">📷</span>
                        <span className="avatar-upload-text">点击上传</span>
                      </div>
                    )}
                  </div>
                  {isEditing && avatarPreview && (
                    <button 
                      className="avatar-remove-btn"
                      onClick={removeAvatar}
                      title="移除头像"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="avatar-info">
                  <h3 className="avatar-name">{user.userId}</h3>
                  <p className="avatar-type">{user.userType}</p>
                  {isEditing && (
                    <p className="avatar-hint">点击头像上传新图片</p>
                  )}
                </div>
              </div>

              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />

              <div className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">用户名</label>
                    <input
                      className="profile-input"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">用户类型</label>
                    <input
                      className="profile-input"
                      value={formData.userType}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">邮箱</label>
                    <input
                      className="profile-input"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">电话</label>
                    <input
                      className="profile-input"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {user.userType === '救助组织' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">组织名称</label>
                      <input
                        className="profile-input"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">地址</label>
                      <input
                        className="profile-input"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="请输入详细地址"
                      />
                    </div>
                  </div>
                )}

                {user.userType !== '救助组织' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">地址</label>
                      <input
                        className="profile-input"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        placeholder="请输入详细地址"
                      />
                    </div>
                  </div>
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

export default Profile;
