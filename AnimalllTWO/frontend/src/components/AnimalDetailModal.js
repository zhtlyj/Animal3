import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AnimalDetailModal = ({ item, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 检查是否已被他人领养（必须在条件返回之前调用Hook）
  const isAdoptedByOthers = React.useMemo(() => {
    if (!item || !item.adopter || item.status !== '已领养') return false;
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
  }, [item, user]);

  if (!item) return null;

  const handleAdoptClick = () => {
    if (!user) {
      // 如果未登录，跳转到登录页面
      navigate('/login');
      return;
    }
    
    if (user.userType !== '领养人') {
      alert('只有领养人可以申请领养');
      return;
    }
    
    // 检查是否已被他人领养
    if (isAdoptedByOthers) {
      alert('该动物已被他人领养');
      return;
    }
    
    if (item.status !== '可领养') {
      alert('该动物当前不可领养');
      return;
    }
    
    // 跳转到领养申请页面
    const animalId = item._id || item.id;
    navigate(`/adopt/${animalId}/apply`);
    onClose(); // 关闭模态框
  };

  const handleRescueClick = () => {
    if (!user) {
      // 如果未登录，跳转到登录页面
      navigate('/login');
      return;
    }
    
    if (user.userType !== '救助组织') {
      alert('只有救助组织可以申请救助');
      return;
    }
    
    if (item.status !== '救助中' && item.status !== '紧急求助') {
      alert('该动物当前不需要救助');
      return;
    }
    
    // 检查是否是自己发布的动物
    const isOwner = user._id === item.publisher || 
                     user._id === item.publisher?._id ||
                     String(user._id) === String(item.publisher);
    
    if (isOwner) {
      alert('不能救助自己发布的动物');
      return;
    }
    
    // 跳转到救助申请页面
    const animalId = item._id || item.id;
    navigate(`/rescue/${animalId}/apply`);
    onClose(); // 关闭模态框
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-media">
          {item.media && item.media.length > 0 ? (
            <img src={item.media[0]} alt={item.name} />
          ) : (
            <div className="media-placeholder" />
          )}
        </div>
        <div className="modal-body">
          <h3>{item.name}</h3>
          <div className="modal-tags">
            <span className="tag">{item.species}</span>
            {isAdoptedByOthers && user?.userType === '领养人' ? (
              <span className="tag tag-status" style={{ background: '#ef4444', color: 'white' }}>已被他人领养</span>
            ) : (
              <span className={`tag tag-status status-${item.status}`}>{item.status}</span>
            )}
            <span className="tag">{item.city}</span>
            {item.age && <span className="tag">{item.age}</span>}
          </div>
          <p className="modal-desc">{item.description}</p>
          {isAdoptedByOthers && user?.userType === '领养人' && (
            <div style={{ 
              padding: '12px', 
              background: '#fee2e2', 
              borderRadius: '8px', 
              marginBottom: '16px',
              color: '#991b1b',
              textAlign: 'center'
            }}>
              ⚠️ 该动物已被他人领养
            </div>
          )}
          <div className="modal-actions">
            {item.status === '可领养' && !isAdoptedByOthers ? (
              <button 
                className="auth-button" 
                style={{ width: '100%' }}
                onClick={handleAdoptClick}
              >
                我要领养
              </button>
            ) : (item.status === '救助中' || item.status === '紧急求助') ? (
              <button 
                className="auth-button" 
                style={{ width: '100%' }}
                onClick={handleRescueClick}
              >
                我要帮助
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalDetailModal;



