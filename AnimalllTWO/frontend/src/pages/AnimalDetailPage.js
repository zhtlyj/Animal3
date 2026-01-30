import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAnimals } from '../contexts/AnimalsContext';
import { useAuth } from '../contexts/AuthContext';
import { animalsAPI } from '../services/api';
import BackButton from '../components/BackButton';

const AnimalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findById, likes, toggleLike, favorites, toggleFavorite, updateAnimalStatus, animals, loadAnimals } = useAnimals();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    species: '',
    status: '',
    city: '',
    age: '',
    description: '',
    adoptionRequirements: ''
  });

  // 从后端加载动物详情
  useEffect(() => {
    const loadAnimalDetail = async () => {
      try {
        setLoading(true);
        const response = await animalsAPI.getAnimalById(id);
        if (response.success) {
          const animal = response.data.animal;
          console.log('📋 加载的动物数据:', animal);
          console.log('📋 NFT信息:', animal.nft);
          console.log('📋 交易哈希:', animal.nft?.txHash);
          console.log('📋 合约地址:', animal.nft?.contractAddress);
          setItem(animal);
          
          // 同步收藏和点赞状态到 AnimalsContext
          updateAnimalStatus(animal);
        } else {
          console.error('加载动物详情失败:', response.message);
        }
      } catch (error) {
        console.error('加载动物详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadAnimalDetail();
    }
  }, [id, user?._id, updateAnimalStatus]); // 当用户切换时重新加载

  const mediaList = useMemo(() => (item?.media && item.media.length ? item.media : [item?.cover].filter(Boolean)), [item]);

  const handleLike = () => {
    const animalId = item._id || item.id;
    toggleLike(animalId);
  };

  const handleFavorite = () => {
    const animalId = item._id || item.id;
    toggleFavorite(animalId);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.name} - 动物领养`,
          text: `来看看这只可爱的${item.species}，正在寻找温暖的家！`,
          url: window.location.href
        });
      } catch (error) {
        console.log('分享取消');
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('链接已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  const handleEdit = () => {
    if (item) {
      setEditForm({
        name: item.name || '',
        species: item.species || '',
        status: item.status || '',
        city: item.city || '',
        age: item.age || '',
        description: item.description || '',
        adoptionRequirements: item.adoptionRequirements || ''
      });
      setShowEditModal(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const animalId = item._id || item.id;
      console.log('更新动物ID:', animalId);
      await animalsAPI.updateAnimal(animalId, editForm);
      setShowEditModal(false);
      // 刷新页面或更新数据
      window.location.reload();
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败，请重试');
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditForm({
      name: '',
      species: '',
      status: '',
      city: '',
      age: '',
      description: '',
      adoptionRequirements: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 检查是否为动物发布者
  const isOwner = user && item && (
    user._id === item.publisher || 
    user._id === item.publisher?._id ||
    String(user._id) === String(item.publisher)
  );
  
  // 调试信息
  console.log('用户信息:', user);
  console.log('动物信息:', item);
  console.log('用户ID:', user?._id);
  console.log('发布者ID:', item?.publisher);
  console.log('是否为所有者:', isOwner);
  console.log('用户类型:', user?.userType);
  console.log('动物状态:', item?.status);
  console.log('是否显示救助按钮:', user?.userType === '救助组织' && (item?.status === '救助中' || item?.status === '紧急求助') && !isOwner);

  if (loading) {
    return (
      <div className="animal-detail-page">
        <div className="detail-container">
          <div className="detail-loading">
            <div className="loading-spinner">⏳</div>
            <h2>加载中...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="animal-detail-page">
        <div className="detail-container">
          <div className="detail-error">
            <div className="error-icon">🐾</div>
            <h2>未找到该动物</h2>
            <p>该动物信息可能已被删除或不存在</p>
            <Link to="/home" className="back-home-btn">
              <span className="btn-icon">🏠</span>
              返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animal-detail-page">
      <div className="detail-container">
        {/* 面包屑导航 */}
        <div className="detail-breadcrumb">
          <Link to="/home" className="breadcrumb-link">
            <span className="breadcrumb-icon">🏠</span>
            首页
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">动物详情</span>
        </div>

        {/* 主要内容区域 */}
        <div className="detail-main-content">
          {/* 左侧图片区域 */}
          <div className="detail-media-section">
            <div className="main-image-container">
              {mediaList[activeImg] ? (
                <img 
                  src={mediaList[activeImg]} 
                  alt={item.name} 
                  className="main-image"
                />
              ) : (
                <div className="no-image-placeholder">
                  <div className="placeholder-icon">📷</div>
                  <div className="placeholder-text">暂无图片</div>
                </div>
              )}
              
              {/* 状态标签 */}
              <div className="status-badge-container">
                <span className={`status-badge status-${item.status}`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* 缩略图 */}
            {mediaList.length > 1 && (
              <div className="thumbnail-gallery">
                {mediaList.map((media, index) => (
                  <div
                    key={index}
                    className={`thumbnail-item ${index === activeImg ? 'active' : ''}`}
                    onClick={() => setActiveImg(index)}
                  >
                    <img src={media} alt={`${item.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧信息区域 */}
          <div className="detail-info-section">
            {/* 标题和基本信息 */}
            <div className="detail-header">
              <h1 className="animal-name">{item.name}</h1>
              <div className="animal-tags">
                <span className="info-tag species-tag">
                  <span className="tag-icon">🐾</span>
                  {item.species}
                </span>
                <span className="info-tag location-tag">
                  <span className="tag-icon">📍</span>
                  {item.city}
                </span>
                {item.age && (
                  <span className="info-tag age-tag">
                    <span className="tag-icon">🎂</span>
                    {item.age}
                  </span>
                )}
          </div>
        </div>

            {/* 操作按钮 */}
        <div className="detail-actions">
              <button 
                className={`action-btn like-btn ${likes[item._id] || likes[item.id] ? 'liked' : ''}`}
                onClick={handleLike}
              >
                <span className="btn-icon">
                  {likes[item._id] || likes[item.id] ? '❤️' : '🤍'}
                </span>
            {likes[item._id] || likes[item.id] ? '已点赞' : '点赞'}
          </button>
              
              <button 
                className={`action-btn favorite-btn ${favorites[item._id] || favorites[item.id] ? 'favorited' : ''}`}
                onClick={handleFavorite}
              >
                <span className="btn-icon">
                  {favorites[item._id] || favorites[item.id] ? '💖' : '🤍'}
                </span>
                {favorites[item._id] || favorites[item.id] ? '已收藏' : '收藏'}
              </button>
              
              <button className="action-btn share-btn" onClick={handleShare}>
                <span className="btn-icon">📤</span>
            分享
          </button>
              
              {(isOwner || user?.userType === '救助组织') && (
                <button className="action-btn edit-btn" onClick={handleEdit}>
                  <span className="btn-icon">✏️</span>
                  编辑
                </button>
              )}
              
          {user?.userType === '领养人' && item.status === '可领养' && (
                <Link 
                  to={`/adopt/${item._id || item.id}/apply`} 
                  className="action-btn adopt-btn"
                >
                  <span className="btn-icon">🏠</span>
                  申请领养
                </Link>
              )}
              
              {user?.userType === '救助组织' && (item.status === '救助中' || item.status === '紧急求助') && !isOwner && (
                <button
                  className="action-btn rescue-btn"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('我要帮助按钮被点击');
                    console.log('动物ID:', item._id || item.id);
                    console.log('用户类型:', user?.userType);
                    console.log('动物状态:', item.status);
                    const animalId = item._id || item.id;
                    if (animalId) {
                      navigate(`/rescue/${animalId}/apply`);
                    } else {
                      console.error('动物ID不存在');
                      alert('无法获取动物信息，请刷新页面重试');
                    }
                  }}
                  style={{ cursor: 'pointer', zIndex: 10 }}
                >
                  <span className="btn-icon">🆘</span>
                  我要帮助
                </button>
              )}
            </div>

            {/* 动物描述 */}
            <div className="info-section">
              <h3 className="section-title">
                <span className="title-icon">📝</span>
                关于TA
              </h3>
              <div className="description-content">
                <p className={`animal-description ${showFullDescription ? 'expanded' : ''}`}>
                  {item.description}
                </p>
                {item.description && item.description.length > 200 && (
                  <button 
                    className="toggle-description-btn"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? '收起' : '展开'}
                  </button>
          )}
        </div>
      </div>

            {/* 领养条件 */}
            <div className="info-section">
              <h3 className="section-title">
                <span className="title-icon">📋</span>
                领养条件
              </h3>
              <div className="requirements-content">
                <p className="adoption-requirements">
                  {item.adoptionRequirements || '需年满18岁，有稳定住所与经济来源，接受回访。'}
                </p>
              </div>
            </div>

            {/* 区块链信息 */}
            <div className="info-section">
              <h3 className="section-title">
                <span className="title-icon">⛓️</span>
                区块链信息
              </h3>
              <div className="blockchain-content">
                {(() => {
                  // 判断是否已上链（有tokenId且不为空）
                  const hasTokenId = item.nft?.tokenId && 
                                    item.nft.tokenId !== '' && 
                                    item.nft.tokenId !== 'null' && 
                                    item.nft.tokenId !== 'undefined' &&
                                    item.nft.tokenId !== 'unknown';
                  
                  if (hasTokenId) {
                    // 已上链，显示Token ID、交易哈希和上链状态
                    const hasTxHash = item.nft?.txHash && 
                                     item.nft.txHash !== '' && 
                                     item.nft.txHash !== 'null' && 
                                     item.nft.txHash !== 'undefined';
                    
                    return (
                      <div className="nft-info">
                        <div className="nft-item">
                          <span className="nft-label">Token ID：</span>
                          <span className="nft-value">{item.nft.tokenId}</span>
                        </div>
                        {hasTxHash && (
                          <div className="nft-item">
                            <span className="nft-label">交易哈希：</span>
                            <span className="nft-value nft-txhash">{item.nft.txHash}</span>
                          </div>
                        )}
                        <div className="nft-item">
                          <span className="nft-label">上链状态：</span>
                          <span className="nft-value nft-status-onchain">
                            ✅ 已上链
                          </span>
                        </div>
                      </div>
                    );
                  } else {
                    // 未上链
                    return (
                      <div className="no-nft">
                        <span className="no-nft-icon">🔗</span>
                        <span className="no-nft-text">暂未上链</span>
                        <div className="nft-item" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                          <span className="nft-label">上链状态：</span>
                          <span className="nft-value nft-status-offchain">
                            ⏳ 未上链
                          </span>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 历史记录 */}
        {item.history && item.history.length > 0 && (
          <div className="history-section">
            <h3 className="section-title">
              <span className="title-icon">📜</span>
              历史记录
            </h3>
            <div className="timeline">
              {item.history.map((record, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">
                    <div className="marker-dot"></div>
                    {index < item.history.length - 1 && <div className="marker-line"></div>}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{record.type}</div>
                    <div className="timeline-details">
                      <span className="timeline-by">操作者：{record.by || '系统'}</span>
                      <span className="timeline-time">
                        {new Date(record.at).toLocaleString()}
                      </span>
                      {record.tx && (
                        <span className="timeline-tx">
                          交易：{record.tx.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                    {record.details && (
                      <div className="timeline-description">{record.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
      </div>

      {/* 编辑模态框 */}
      {showEditModal && (
        <div className="edit-modal-backdrop" onClick={handleEditCancel}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2 className="edit-modal-title">
                <span className="title-icon">✏️</span>
                编辑动物信息
              </h2>
              <button className="edit-modal-close" onClick={handleEditCancel}>
                ✕
              </button>
            </div>
            
            <form className="edit-modal-content" onSubmit={handleEditSubmit}>
              <div className="edit-form-grid">
                <div className="form-group">
                  <label className="form-label">动物名称 *</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">物种 *</label>
                  <select
                    name="species"
                    value={editForm.species}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">请选择物种</option>
                    <option value="猫">猫</option>
                    <option value="狗">狗</option>
                    <option value="兔">兔</option>
                    <option value="鸟">鸟</option>
                    <option value="爬宠">爬宠</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">状态 *</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">请选择状态</option>
                    <option value="可领养">可领养</option>
                    <option value="救助中">救助中</option>
                    <option value="已领养">已领养</option>
                    <option value="紧急求助">紧急求助</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">城市 *</label>
                  <input
                    type="text"
                    name="city"
                    value={editForm.city}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">年龄</label>
                  <input
                    type="text"
                    name="age"
                    value={editForm.age}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="如：2岁、幼崽等"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label className="form-label">描述 *</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="4"
                    required
                    placeholder="请详细描述动物的性格、特点、经历等..."
                  />
                </div>
                
                <div className="form-group full-width">
                  <label className="form-label">领养条件</label>
                  <textarea
                    name="adoptionRequirements"
                    value={editForm.adoptionRequirements}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="3"
                    placeholder="请说明领养条件和要求..."
                  />
                </div>
              </div>
              
              <div className="edit-modal-actions">
                <button type="button" className="cancel-btn" onClick={handleEditCancel}>
                  取消
                </button>
                <button type="submit" className="save-btn">
                  <span className="btn-icon">💾</span>
                  保存修改
                </button>
              </div>
            </form>
          </div>
      </div>
      )}
      <BackButton />
    </div>
  );
};

export default AnimalDetailPage;


