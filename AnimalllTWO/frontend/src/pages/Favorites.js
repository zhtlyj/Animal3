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
    if (keyword && !item.name.includes(keyword)) return false;
    if (species && item.species !== species) return false;
    if (city && item.city !== city) return false;
    if (status && item.status !== status) return false;
    return true;
  });
};

const Favorites = () => {
  const { user } = useAuth();
  const { animals, favorites } = useAnimals();
  const location = useLocation();
  const role = user?.userType || '游客';
  const [query, setQuery] = useState({ keyword: '', species: '', city: '', status: '' });
  const [active, setActive] = useState(null);

  // 筛选出已收藏的动物
  const favoriteAnimals = useMemo(() => {
    return animals.filter(animal => favorites[animal.id || animal._id]);
  }, [animals, favorites]);

  const list = useMemo(() => applyFilters(favoriteAnimals, query), [favoriteAnimals, query]);

  // 处理从侧边栏传来的滚动信息
  useEffect(() => {
    if (location.state?.scrollToAnimals) {
      setTimeout(() => {
        const animalGrid = document.querySelector('.grid');
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
    <div className="favorites-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">❤️</span>
          我的收藏
        </h1>
        <p className="page-subtitle">查看您收藏的可爱动物们</p>
      </div>

      <div className="page-toolbar">
        <h3 className="section-title">收藏的动物</h3>
        <SearchFilter query={query} onChange={setQuery} role={role} animals={favoriteAnimals} />
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <h3>还没有收藏任何动物</h3>
          <p>浏览首页，点击右上角的爱心按钮来收藏您喜欢的动物吧！</p>
        </div>
      ) : (
        <div className="grid">
          {list.map((item) => (
            <AnimalCard key={item.id || item._id} item={item} onClick={setActive} />
          ))}
        </div>
      )}

      <AnimalDetailModal item={active} onClose={() => setActive(null)} />
      <BackButton />
    </div>
  );
};

export default Favorites;
