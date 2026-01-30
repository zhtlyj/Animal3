import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAnimals } from '../contexts/AnimalsContext';
import { animalsAPI } from '../services/api';
import BackButton from '../components/BackButton';
import AnimalCard from '../components/AnimalCard';
import './MyAdoptedAnimals.css';

const MyAdoptedAnimals = () => {
  const { user, loading: authLoading } = useAuth();
  const { animals, loadAnimals } = useAnimals();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // 筛选出当前用户领养的所有动物
  const myAdoptedAnimals = useMemo(() => {
    // 等待用户数据加载完成
    if (authLoading) {
      console.log('MyAdoptedAnimals: 等待用户数据加载...');
      return [];
    }
    
    if (!user) {
      console.log('MyAdoptedAnimals: 用户未登录');
      return [];
    }
    
    // 尝试多种方式获取用户ID
    const userId = user._id ? user._id.toString() : (user.id ? user.id.toString() : null);
    
    if (!userId) {
      console.log('MyAdoptedAnimals: 用户没有ID，用户对象:', user);
      console.log('MyAdoptedAnimals: 用户对象键:', Object.keys(user));
      return [];
    }
    
    console.log('MyAdoptedAnimals: 用户ID:', userId);
    console.log('MyAdoptedAnimals: 开始筛选，用户ID:', userId);
    console.log('MyAdoptedAnimals: 总动物数:', animals.length);
    
    const filtered = animals.filter(animal => {
      // 首先检查 isMyAnimal 字段（后端返回的）
      if (animal.isMyAnimal === true) {
        console.log('MyAdoptedAnimals: 找到我的动物（isMyAnimal=true）:', animal.name);
        return true;
      }
      
      // 检查动物状态必须是"已领养"
      if (animal.status !== '已领养') {
        return false;
      }
      
      // 检查是否有领养者
      if (!animal.adopter) {
        console.log('MyAdoptedAnimals: 动物', animal.name, '状态为已领养但没有adopter字段');
        return false;
      }
      
      // 处理不同的adopter格式（populate后的对象）
      let adopterId = null;
      
      // 如果是对象（populate后的），取_id
      if (animal.adopter && animal.adopter._id) {
        adopterId = animal.adopter._id.toString();
      } 
      // 如果是对象但没有_id，尝试id字段
      else if (animal.adopter && animal.adopter.id) {
        adopterId = animal.adopter.id.toString();
      }
      // 如果是字符串
      else if (typeof animal.adopter === 'string') {
        adopterId = animal.adopter;
      } 
      // 尝试toString
      else if (animal.adopter && animal.adopter.toString) {
        try {
          adopterId = animal.adopter.toString();
        } catch (e) {
          console.log('MyAdoptedAnimals: adopter.toString() 失败:', e);
          return false;
        }
      }
      
      // 调试信息
      console.log('MyAdoptedAnimals: 检查动物', animal.name, {
        status: animal.status,
        adopter: animal.adopter,
        adopterId: adopterId,
        userId: userId,
        match: adopterId === userId,
        isMyAnimal: animal.isMyAnimal
      });
      
      if (adopterId && adopterId === userId) {
        console.log('✅ MyAdoptedAnimals: 找到我的动物（adopter匹配）:', animal.name);
        return true;
      }
      
      return false;
    });
    
    console.log('MyAdoptedAnimals: 筛选结果，找到', filtered.length, '只已领养的动物');
    filtered.forEach(animal => {
      const adopterId = animal.adopter?._id || animal.adopter?.id || animal.adopter;
      console.log('  ✅', animal.name, '状态:', animal.status, '领养者ID:', adopterId);
    });
    
    return filtered;
  }, [animals, user, authLoading]);

  useEffect(() => {
    const fetchData = async () => {
      // 等待用户认证完成
      if (authLoading) {
        console.log('MyAdoptedAnimals: 等待用户认证...');
        return;
      }

      if (!user) {
        console.log('MyAdoptedAnimals: 用户未登录，停止加载');
        setLoading(false);
        return;
      }

      // 尝试多种方式获取用户ID
      const userId = user._id ? user._id.toString() : (user.id ? user.id.toString() : null);
      
      if (!userId) {
        console.log('MyAdoptedAnimals: 用户没有ID，用户对象:', user);
        console.log('MyAdoptedAnimals: 用户对象键:', Object.keys(user));
        setLoading(false);
        return;
      }
      
      console.log('MyAdoptedAnimals: 开始加载动物列表，用户ID:', userId);

      try {
        setLoading(true);
        console.log('MyAdoptedAnimals: 开始加载动物列表，用户ID:', user._id);
        // 加载所有动物，不限制数量
        await loadAnimals({ limit: 1000 });
        console.log('MyAdoptedAnimals: 动物列表加载完成');
      } catch (error) {
        console.error('加载动物列表失败:', error);
        setMsg('加载失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, loadAnimals]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="error-message">请先登录</div>
        <button className="auth-button" onClick={() => navigate('/login')}>去登录</button>
      </div>
    );
  }

  if (user.userType !== '领养人') {
    return (
      <div className="auth-container">
        <div className="error-message">只有领养人可以查看此页面</div>
        <button className="auth-button" onClick={() => navigate('/home')}>返回首页</button>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="my-adopted-animals-page">
        <div className="loading-message">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="my-adopted-animals-page">
        <div className="page-header">
          <h1 className="page-title">我的领养动物</h1>
          <p className="page-subtitle">查看您已成功领养的所有动物</p>
        </div>

        {msg && (
          <div className="error-message" style={{ margin: '20px auto', maxWidth: '1200px' }}>
            {msg}
          </div>
        )}

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">🏠</div>
            <div className="stat-content">
              <div className="stat-number">{myAdoptedAnimals.length}</div>
              <div className="stat-label">已领养总数</div>
            </div>
          </div>
        </div>

        <div className="animals-section">
          {myAdoptedAnimals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐾</div>
              <h3>还没有领养任何动物</h3>
              <p>去首页或领养中心寻找您心仪的动物吧！</p>
              <button 
                className="auth-button" 
                onClick={() => navigate('/adoption')}
                style={{ marginTop: '20px' }}
              >
                前往领养中心
              </button>
            </div>
          ) : (
            <>
              <h2 className="section-title">我的动物们 ({myAdoptedAnimals.length}只)</h2>
              <div className="animals-grid">
                {myAdoptedAnimals.map((animal) => (
                  <div key={animal._id || animal.id} className="animal-card-wrapper">
                    <AnimalCard 
                      item={animal} 
                      showAdoptedStatus={true}
                      onClick={(item) => navigate(`/my-animals/${item._id || item.id}`)}
                    />
                    <div className="animal-info-overlay">
                      <div className="info-item">
                        <span className="info-label">领养时间：</span>
                        <span className="info-value">
                          {animal.history && animal.history.length > 0 
                            ? animal.history
                                .filter(h => h.type === '领养成功')
                                .map(h => new Date(h.at).toLocaleDateString('zh-CN'))[0] || '未知'
                            : '未知'}
                        </span>
                      </div>
                      {animal.lifePhotos && animal.lifePhotos.length > 0 && (
                        <div className="info-item">
                          <span className="info-label">生活照：</span>
                          <span className="info-value">{animal.lifePhotos.length}张</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <BackButton />
    </>
  );
};

export default MyAdoptedAnimals;

