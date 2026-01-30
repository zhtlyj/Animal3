import React, { useMemo, useState } from 'react';
import { useAnimals } from '../contexts/AnimalsContext';
import { useAuth } from '../contexts/AuthContext';
import { animalsAPI } from '../services/api';
import BackButton from '../components/BackButton';
import './MyAnimals.css';

const MyAnimals = () => {
  const { user } = useAuth();
  const { animals, updateAnimal, deleteAnimal, loadAnimals } = useAnimals();
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // 筛选出当前用户发布的动物
  const myAnimals = useMemo(() => {
    if (!user) return [];
    return animals.filter(animal => 
      animal.publisher === user._id || 
      animal.publisher === user.id ||
      animal.publisherId === user._id ||
      animal.publisherId === user.id
    );
  }, [animals, user]);

  // 统计信息
  const stats = useMemo(() => {
    const total = myAnimals.length;
    const adoptable = myAnimals.filter(a => a.status === '可领养').length;
    const rescuing = myAnimals.filter(a => a.status === '救助中').length;
    const adopted = myAnimals.filter(a => a.status === '已领养').length;
    const urgent = myAnimals.filter(a => a.status === '紧急求助').length;
    return { total, adoptable, rescuing, adopted, urgent };
  }, [myAnimals]);

  const handleEdit = (animal) => {
    // 映射数据库字段名到前端表单字段名，同时保留原字段名以兼容
    setEditingAnimal({ 
      ...animal,
      requirements: animal.adoptionRequirements || animal.requirements || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingAnimal(null);
    setMessage({ type: '', text: '' });
  };

  const handleSaveEdit = async () => {
    try {
      const id = editingAnimal._id || editingAnimal.id;
      console.log('开始更新动物信息，ID:', id);
      
      // 只发送需要更新的字段，减少请求体大小
      const updateData = {
        name: editingAnimal.name,
        species: editingAnimal.species,
        status: editingAnimal.status,
        city: editingAnimal.city,
        age: editingAnimal.age || '',
        description: editingAnimal.description,
        adoptionRequirements: editingAnimal.adoptionRequirements || editingAnimal.requirements || ''
      };
      
      // 如果封面图片有变化，才包含它
      if (editingAnimal.cover) {
        updateData.cover = editingAnimal.cover;
      }
      
      // 如果媒体数组有变化，才包含它（但限制大小）
      if (editingAnimal.media && Array.isArray(editingAnimal.media)) {
        // 只保留前10张图片，避免请求体过大
        updateData.media = editingAnimal.media.slice(0, 10);
      }
      
      console.log('精简后的更新数据:', updateData);
      
      const result = await updateAnimal(id, updateData);
      console.log('更新成功，返回结果:', result);
      
      setMessage({ type: 'success', text: '动物信息更新成功！' });
      setEditingAnimal(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('更新失败:', error);
      setMessage({ type: 'error', text: error.message || '更新失败，请重试' });
    }
  };

  const handleDelete = async (animal) => {
    setDeleteConfirm(animal);
  };

  const confirmDelete = async () => {
    try {
      const id = deleteConfirm._id || deleteConfirm.id;
      console.log('开始删除动物信息，ID:', id);
      
      const result = await deleteAnimal(id);
      console.log('删除成功，返回结果:', result);
      
      setMessage({ type: 'success', text: '动物信息已删除' });
      setDeleteConfirm(null);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('删除失败:', error);
      setMessage({ type: 'error', text: error.message || '删除失败，请重试' });
      setDeleteConfirm(null);
    }
  };

  const handleInputChange = (field, value) => {
    setEditingAnimal(prev => ({ ...prev, [field]: value }));
  };

  const handleMintNFT = async (animal) => {
    if (!window.confirm(`确定要将"${animal.name}"的信息上链吗？上链后信息将永久保存在区块链上。`)) {
      return;
    }

    try {
      const id = animal._id || animal.id;
      setMessage({ type: 'info', text: '正在上链，请稍候...' });
      
      const response = await animalsAPI.mintNFT(id);
      
      if (response.success) {
        setMessage({ type: 'success', text: '上链成功！NFT信息已保存。' });
        // 重新加载动物列表以更新上链状态
        await loadAnimals();
      } else {
        setMessage({ type: 'error', text: response.message || '上链失败，请重试' });
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('上链失败:', error);
      setMessage({ type: 'error', text: error.message || '上链失败，请重试' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  if (!user) {
    return (
      <div className="my-animals-page">
        <div className="management-error">
          <h2>请先登录</h2>
          <p>您需要登录才能查看发布的动物信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-animals-page">
      <div className="management-header">
        <h1 className="management-title">我的发布</h1>
        <p className="management-subtitle">管理您发布的动物信息</p>
      </div>

      <div className="management-main">
        {message.text && (
          <div className={`management-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="stats-grid">
          <div className="stat-card-item">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">总发布数</div>
            </div>
          </div>
          <div className="stat-card-item">
            <div className="stat-icon">💚</div>
            <div className="stat-content">
              <div className="stat-number">{stats.adoptable}</div>
              <div className="stat-label">可领养</div>
            </div>
          </div>
          <div className="stat-card-item">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <div className="stat-number">{stats.rescuing}</div>
              <div className="stat-label">救助中</div>
            </div>
          </div>
          <div className="stat-card-item">
            <div className="stat-icon">🏡</div>
            <div className="stat-content">
              <div className="stat-number">{stats.adopted}</div>
              <div className="stat-label">已领养</div>
            </div>
          </div>
          <div className="stat-card-item">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-number">{stats.urgent}</div>
              <div className="stat-label">紧急求助</div>
            </div>
          </div>
        </div>

        {/* 动物列表 */}
        <div className="management-section">
          <div className="section-header">
            <h2 className="section-title">
              <span>🐾</span>
              已发布的动物
            </h2>
          </div>

          {myAnimals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>还没有发布任何动物</h3>
              <p>点击导航栏的"发布"按钮来发布您的第一只动物吧！</p>
            </div>
          ) : (
            <div className="animals-table">
              {myAnimals.map((animal) => (
                <div key={animal._id || animal.id} className="animal-row">
                  <div className="animal-row-image">
                    {animal.cover || (animal.media && animal.media[0]) ? (
                      <img 
                        src={animal.cover || animal.media[0]} 
                        alt={animal.name}
                      />
                    ) : (
                      <div className="no-image">📷</div>
                    )}
                  </div>
                  <div className="animal-row-info">
                    <h3 className="animal-row-name">{animal.name}</h3>
                    <div className="animal-row-tags">
                      <span className="tag">{animal.species}</span>
                      <span className="tag">{animal.city}</span>
                      <span className="tag">{animal.age}</span>
                      <span className={`tag tag-status status-${animal.status}`}>
                        {animal.status}
                      </span>
                    </div>
                    <p className="animal-row-desc">{animal.description}</p>
                    {animal.nft && animal.nft.tokenId && (
                      <div className="nft-badge" style={{ 
                        marginTop: '8px', 
                        padding: '4px 8px', 
                        background: '#10b981', 
                        color: 'white', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        display: 'inline-block'
                      }}>
                        ⛓️ 已上链
                      </div>
                    )}
                  </div>
                  <div className="animal-row-actions">
                    {!animal.nft || !animal.nft.tokenId ? (
                      <button 
                        className="action-btn mint-action-btn"
                        onClick={() => handleMintNFT(animal)}
                        style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          marginRight: '8px'
                        }}
                      >
                        <span className="btn-icon">⛓️</span>
                        上链
                      </button>
                    ) : null}
                    <button 
                      className="action-btn edit-action-btn"
                      onClick={() => handleEdit(animal)}
                    >
                      <span className="btn-icon">✏️</span>
                      编辑
                    </button>
                    <button 
                      className="action-btn delete-action-btn"
                      onClick={() => handleDelete(animal)}
                    >
                      <span className="btn-icon">🗑️</span>
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 编辑模态框 */}
      {editingAnimal && (
        <div className="modal-backdrop" onClick={handleCancelEdit}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3 className="edit-modal-title">
                <span>✏️</span>
                编辑动物信息
              </h3>
              <button className="edit-modal-close" onClick={handleCancelEdit}>
                ×
              </button>
            </div>
            <div className="edit-modal-content">
              <div className="edit-form-grid">
                <div className="form-group">
                  <label className="form-label">动物名称</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingAnimal.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">种类</label>
                  <select
                    className="form-select"
                    value={editingAnimal.species}
                    onChange={(e) => handleInputChange('species', e.target.value)}
                  >
                    <option value="猫">猫</option>
                    <option value="狗">狗</option>
                    <option value="兔">兔</option>
                    <option value="鸟">鸟</option>
                    <option value="爬宠">爬宠</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">年龄</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingAnimal.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">城市</label>
                  <select
                    className="form-select"
                    value={editingAnimal.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  >
                    <option value="北京">北京</option>
                    <option value="上海">上海</option>
                    <option value="广州">广州</option>
                    <option value="深圳">深圳</option>
                    <option value="杭州">杭州</option>
                    <option value="成都">成都</option>
                    <option value="武汉">武汉</option>
                    <option value="西安">西安</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <select
                    className="form-select"
                    value={editingAnimal.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="可领养">可领养</option>
                    <option value="救助中">救助中</option>
                    <option value="已领养">已领养</option>
                    <option value="紧急求助">紧急求助</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">描述</label>
                  <textarea
                    className="form-textarea"
                    rows="4"
                    value={editingAnimal.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">领养要求</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={editingAnimal.adoptionRequirements || editingAnimal.requirements || ''}
                    onChange={(e) => handleInputChange('adoptionRequirements', e.target.value)}
                  />
                </div>
              </div>
              <div className="edit-modal-actions">
                <button className="cancel-btn" onClick={handleCancelEdit}>
                  取消
                </button>
                <button className="save-btn" onClick={handleSaveEdit}>
                  <span className="btn-icon">💾</span>
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {deleteConfirm && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3 className="confirm-title">确认删除</h3>
            <p className="confirm-text">
              确定要删除 <strong>{deleteConfirm.name}</strong> 的信息吗？此操作无法撤销。
            </p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>
                取消
              </button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                <span className="btn-icon">🗑️</span>
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <BackButton />
    </div>
  );
};

export default MyAnimals;

