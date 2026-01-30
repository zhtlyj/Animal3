import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchFilter from '../components/SearchFilter';
import AnimalCard from '../components/AnimalCard';
import AnimalDetailModal from '../components/AnimalDetailModal';
import BackButton from '../components/BackButton';
import { useAnimals } from '../contexts/AnimalsContext';
import { useAuth } from '../contexts/AuthContext';

const applyFilters = (list, { keyword, species, city, status }) => {
  return list.filter((item) => {
    // 只显示可领养的动物
    if (item.status !== '可领养') return false;
    
    if (keyword && !item.name.includes(keyword)) return false;
    if (species && item.species !== species) return false;
    if (city && item.city !== city) return false;
    if (status && item.status !== status) return false;
    return true;
  });
};

const AdoptionCenter = () => {
  const { user } = useAuth();
  const { animals } = useAnimals();
  const location = useLocation();
  const role = user?.userType || '游客';
  const [query, setQuery] = useState({ keyword: '', species: '', city: '', status: '' });
  const [active, setActive] = useState(null);

  // 只获取可领养的动物
  const adoptableAnimals = useMemo(() => {
    return animals.filter(animal => animal.status === '可领养');
  }, [animals]);

  // 只对可领养的动物应用筛选
  const list = useMemo(() => applyFilters(adoptableAnimals, query), [adoptableAnimals, query]);

  // 统计可领养动物数量
  const adoptableCount = adoptableAnimals.length;

  // 处理从侧边栏传来的滚动信息
  useEffect(() => {
    if (location.state?.scrollToAnimals) {
      setTimeout(() => {
        const animalGrid = document.querySelector('.adoption-grid');
        if (animalGrid) {
          animalGrid.style.border = '2px solid #667eea';
          animalGrid.style.borderRadius = '12px';
          animalGrid.style.padding = '8px';
          animalGrid.style.transition = 'all 0.3s ease';
          
          animalGrid.scrollIntoView({ behavior: 'smooth' });
          
          setTimeout(() => {
            animalGrid.style.border = 'none';
            animalGrid.style.padding = '0';
          }, 3000);
        }
      }, 300);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="adoption-center">
      <div className="adoption-header">
        <h1 className="adoption-title">领养中心</h1>
        <p className="adoption-subtitle">浏览所有可领养的毛孩子，找到您心仪的小伙伴，给它一个温暖的家</p>
      </div>

      <div className="adoption-main">
        <div className="adoption-toolbar">
          <h3 className="section-title">探索可爱伙伴</h3>
          <SearchFilter query={query} onChange={setQuery} role={role} hideStatus={true} animals={adoptableAnimals} />
        </div>

        <div className="adoption-stats">
          <div className="stat-card">
            <div className="stat-number">{adoptableCount}</div>
            <div className="stat-label">可领养动物</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{list.length}</div>
            <div className="stat-label">筛选结果</div>
          </div>
        </div>

        <div className="adoption-grid">
          {list.map((item) => (
            <AnimalCard key={item.id || item._id} item={item} onClick={setActive} />
          ))}
        </div>
      </div>

      <AnimalDetailModal item={active} onClose={() => setActive(null)} />
      <BackButton />
    </div>
  );
};

export default AdoptionCenter;
