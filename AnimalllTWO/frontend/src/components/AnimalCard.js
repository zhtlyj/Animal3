import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnimals } from '../contexts/AnimalsContext';
import { useAuth } from '../contexts/AuthContext';

const AnimalCard = ({ item, onClick, showAdoptedStatus = false }) => {
  const { likes, favorites, toggleLike, toggleFavorite } = useAnimals();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 检查是否是当前用户领养的动物
  const isMyAnimal = React.useMemo(() => {
    if (!user || !user._id) return false;
    if (item.isMyAnimal === true) return true;
    
    if (!item.adopter) return false;
    
    const userId = user._id.toString();
    
    // 处理不同的adopter格式
    if (item.adopter._id) {
      return item.adopter._id.toString() === userId;
    }
    if (typeof item.adopter === 'string') {
      return item.adopter === userId;
    }
    if (item.adopter.toString) {
      try {
        return item.adopter.toString() === userId;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }, [item.isMyAnimal, item.adopter, user]);

  // 检查是否已被他人领养（非当前用户）
  // 注意：如果 isMyAnimal 为 true，则 isAdoptedByOthers 必须为 false
  const isAdoptedByOthers = React.useMemo(() => {
    // 如果是我的动物，则不是被他人领养
    if (isMyAnimal) return false;
    
    if (!item.adopter || item.status !== '已领养') return false;
    if (!user || !user._id) {
      // 未登录用户，如果状态是已领养，说明已被他人领养
      return true;
    }
    
    const userId = user._id.toString();
    
    // 检查领养者是否是当前用户
    if (item.adopter._id) {
      return item.adopter._id.toString() !== userId;
    }
    if (typeof item.adopter === 'string') {
      return item.adopter !== userId;
    }
    if (item.adopter.toString) {
      try {
        return item.adopter.toString() !== userId;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }, [item.adopter, item.status, user, isMyAnimal]);

  // 处理卡片点击
  const handleCardClick = (e) => {
    // 如果在"我的领养动物"页面（showAdoptedStatus为true），直接跳转，不显示弹窗
    if (showAdoptedStatus && isMyAnimal && user?.userType === '领养人') {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/my-animals/${item.id || item._id}`);
      return;
    }
    
    // 如果已被他人领养，显示提示（但不在"我的领养动物"页面）
    if (isAdoptedByOthers && user?.userType === '领养人' && !showAdoptedStatus) {
      e.preventDefault();
      e.stopPropagation();
      alert('该动物已被他人领养');
      return;
    }
    
    // 如果是我的动物，跳转到管理页面
    if (isMyAnimal && user?.userType === '领养人') {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/my-animals/${item.id || item._id}`);
      return;
    }
    
    // 其他情况，执行原有的onClick
    if (onClick) {
      onClick(item);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/animals/${item.id || item._id}`;
    if (navigator.share) {
      navigator.share({ title: item.name, text: item.description, url }).catch(() => {});
    } else {
      navigator.clipboard && navigator.clipboard.writeText(url);
      // 简单反馈可以在页面顶部或toast，这里保持静默
    }
  };

  return (
    <div className="animal-card" onClick={handleCardClick}>
      <div className="animal-cover-container">
        <Link to={`/animals/${item.id || item._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div 
            className="animal-cover" 
            style={{ 
              backgroundImage: `url(${item.cover || 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=400&auto=format&fit=crop'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} 
          />
        </Link>
        <button 
          className="favorite-btn"
          onClick={(e) => { 
            e.stopPropagation(); 
            toggleFavorite(item.id || item._id); 
          }}
          title={favorites[item.id || item._id] ? '取消收藏' : '收藏'}
        >
          {favorites[item.id || item._id] ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="animal-body">
        <div className="animal-tags">
          {showAdoptedStatus && isMyAnimal && user?.userType === '领养人' ? (
            // 在"我的领养动物"页面，显示"已领养"
            <span className={`tag tag-status status-已领养`}>已领养</span>
          ) : isMyAnimal && user?.userType === '领养人' ? (
            // 在首页等其他页面，如果是我领养的动物，显示"已领养"
            <span className={`tag tag-status status-已领养`}>已领养</span>
          ) : isAdoptedByOthers && user?.userType === '领养人' ? (
            <span className="tag tag-status" style={{ background: '#ef4444', color: 'white' }}>已被他人领养</span>
          ) : (
            <span className={`tag tag-status status-${item.status}`}>{item.status}</span>
          )}
          <span className="tag">{item.species}</span>
          <span className="tag">{item.city}</span>
        </div>
        <h4 className="animal-name">{item.name}</h4>
        <p className="animal-desc">{item.description}</p>

        <div className="animal-actions">
          {isMyAnimal && user?.userType === '领养人' ? (
            <button 
              className="animal-action-btn detail-btn"
              onClick={(e) => { 
                e.stopPropagation(); 
                navigate(`/my-animals/${item.id || item._id}`); 
              }}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              🏠 管理我的动物
            </button>
          ) : (
            <>
              <button 
                className="animal-action-btn like-btn"
                onClick={(e) => { e.stopPropagation(); toggleLike(item.id || item._id); }}
              >
                {likes[item.id || item._id] ? '❤️ 已点赞' : '🤍 点赞'}
              </button>
              <button 
                className="animal-action-btn share-btn"
                onClick={handleShare}
              >
                📤 分享
              </button>
              <Link 
                to={`/animals/${item.id || item._id}`}
                className="animal-action-btn detail-btn"
                onClick={(e) => e.stopPropagation()}
              >
                👁️ 查看详情
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimalCard;


