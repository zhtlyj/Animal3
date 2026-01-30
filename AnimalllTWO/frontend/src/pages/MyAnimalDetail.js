import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { animalsAPI } from '../services/api';
import BackButton from '../components/BackButton';
import './MyAnimalDetail.css';

const MyAnimalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadAnimal = async () => {
      try {
        setLoading(true);
        const response = await animalsAPI.getAnimalById(id);
        if (response.success) {
          const animalData = response.data.animal;
          // 检查是否是当前用户领养的动物
          const isMyAnimal = animalData.isMyAnimal || 
            (animalData.adopter && user && animalData.adopter._id === user._id) ||
            (animalData.adopter && user && animalData.adopter.toString() === user._id.toString());
          
          if (!isMyAnimal || user?.userType !== '领养人') {
            setMsg('您无权访问此页面');
            setTimeout(() => navigate('/home'), 2000);
            return;
          }
          
          setAnimal(animalData);
        } else {
          setMsg('加载动物信息失败');
        }
      } catch (error) {
        console.error('加载动物信息失败:', error);
        setMsg('加载动物信息失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      loadAnimal();
    }
  }, [id, user, navigate]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setMsg('请选择图片文件');
      return;
    }

    // 检查文件大小（限制5MB）
    const validFiles = imageFiles.filter(file => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== imageFiles.length) {
      setMsg('部分文件过大，已跳过（限制5MB）');
    }

    setUploading(true);
    setMsg('');

    try {
      // 转换为base64
      for (const file of validFiles) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // 上传生活照
        const response = await animalsAPI.uploadLifePhoto(id, {
          photoUrl: base64,
          description: photoDescription || ''
        });

        if (response.success) {
          setAnimal(response.data.animal);
          setMsg('生活照上传成功！');
          setPhotoDescription('');
        } else {
          setMsg(response.message || '上传失败');
        }
      }
    } catch (error) {
      console.error('上传生活照失败:', error);
      setMsg(error.message || '上传失败，请重试');
    } finally {
      setUploading(false);
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('确定要删除这张生活照吗？')) {
      return;
    }

    try {
      const response = await animalsAPI.deleteLifePhoto(id, photoId);
      if (response.success) {
        setAnimal(response.data.animal);
        setMsg('生活照删除成功');
      } else {
        setMsg(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除生活照失败:', error);
      setMsg(error.message || '删除失败，请重试');
    }
  };

  if (!user || user.userType !== '领养人') {
    return (
      <div className="auth-container">
        <div className="error-message">请以领养人身份登录</div>
        <button className="auth-button" onClick={() => navigate('/login')}>去登录</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-message">加载中...</div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="auth-container">
        <div className="error-message">{msg || '未找到该动物'}</div>
        <button className="auth-button" onClick={() => navigate('/home')}>返回首页</button>
      </div>
    );
  }

  return (
    <>
      <div className="my-animal-detail-page">
        <div className="my-animal-header">
          <h1 className="my-animal-title">我的动物：{animal.name}</h1>
          <p className="my-animal-subtitle">记录{animal.name}的快乐生活</p>
        </div>

        {msg && (
          <div className={msg.includes('成功') ? 'success-message' : 'error-message'}>
            {msg}
          </div>
        )}

        <div className="my-animal-content">
          <div className="animal-info-card">
            <div className="animal-cover-section">
              <img 
                src={animal.cover || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=400&auto=format&fit=crop'} 
                alt={animal.name}
                className="animal-cover-image"
              />
            </div>
            <div className="animal-info-section">
              <h2>{animal.name}</h2>
              <div className="info-row">
                <span className="info-label">领养时间：</span>
                <span>
                  {animal.history && animal.history.length > 0 
                    ? animal.history
                        .filter(h => h.type === '领养成功')
                        .map(h => new Date(h.at).toLocaleDateString('zh-CN', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        }))[0] || '未知'
                    : '未知'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">种类：</span>
                <span>{animal.species}</span>
              </div>
              <div className="info-row">
                <span className="info-label">年龄：</span>
                <span>{animal.age || '未知'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">城市：</span>
                <span>{animal.city}</span>
              </div>
              <div className="info-row">
                <span className="info-label">描述：</span>
                <span>{animal.description}</span>
              </div>
            </div>
          </div>

          <div className="life-photos-section">
            <div className="section-header">
              <h2>生活照</h2>
              <button 
                className="upload-btn"
                onClick={() => setShowUploadModal(true)}
                disabled={uploading}
              >
                {uploading ? '上传中...' : '+ 上传生活照'}
              </button>
            </div>

            {animal.lifePhotos && animal.lifePhotos.length > 0 ? (
              <div className="photos-grid">
                {animal.lifePhotos.map((photo, index) => (
                  <div key={photo._id || index} className="photo-item">
                    <img src={photo.url} alt={`生活照 ${index + 1}`} />
                    {photo.description && (
                      <p className="photo-description">{photo.description}</p>
                    )}
                    <div className="photo-date">
                      {new Date(photo.uploadedAt).toLocaleDateString('zh-CN')}
                    </div>
                    <button
                      className="delete-photo-btn"
                      onClick={() => handleDeletePhoto(photo._id)}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-photos">
                <p>还没有上传生活照</p>
                <p>点击"上传生活照"按钮，记录{animal.name}的快乐时光吧！</p>
              </div>
            )}
          </div>
        </div>

        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>上传生活照</h3>
              <div className="form-group">
                <label>照片描述（可选）</label>
                <textarea
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  placeholder="例如：今天带它去公园玩..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>选择照片</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowUploadModal(false)}>取消</button>
                <button onClick={() => fileInputRef.current?.click()}>
                  选择文件
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BackButton />
    </>
  );
};

export default MyAnimalDetail;

