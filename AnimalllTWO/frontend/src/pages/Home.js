import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Carousel from '../components/Carousel';
import Sidebar from '../components/Sidebar';
import FooterStats from '../components/FooterStats';
import SearchFilter from '../components/SearchFilter';
import AnimalCard from '../components/AnimalCard';
import AnimalDetailModal from '../components/AnimalDetailModal';
import { heroSlides, chainStats, sampleAnimals } from '../data/mock';
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

const Home = () => {
  const { user } = useAuth();
  const { animals } = useAnimals();
  const location = useLocation();
  const role = user?.userType || '游客';
  const [query, setQuery] = useState({ keyword: '', species: '', city: '', status: '' });
  const [active, setActive] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 每页显示4张卡片

  const list = useMemo(() => applyFilters(animals, query), [animals, query]);

  // 计算总页数
  const totalPages = Math.ceil(list.length / itemsPerPage);

  // 获取当前页的数据
  const currentList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return list.slice(startIndex, endIndex);
  }, [list, currentPage, itemsPerPage]);

  // 当筛选条件改变时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // 处理页码变化
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 处理从侧边栏传来的滚动信息
  useEffect(() => {
    if (location.state?.scrollToAnimals) {
      // 延迟执行滚动，确保页面渲染完成
      setTimeout(() => {
        const animalGrid = document.querySelector('.grid');
        if (animalGrid) {
          // 添加高亮效果
          animalGrid.style.border = '2px solid #667eea';
          animalGrid.style.borderRadius = '12px';
          animalGrid.style.padding = '8px';
          animalGrid.style.transition = 'all 0.3s ease';
          
          animalGrid.scrollIntoView({ behavior: 'smooth' });
          
          // 3秒后移除高亮效果
          setTimeout(() => {
            animalGrid.style.border = 'none';
            animalGrid.style.padding = '0';
          }, 3000);
        }
      }, 300);
      
      // 清除state，避免重复滚动
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="home">
      <div className="home-main">
        <Carousel slides={heroSlides} />

        <div className="home-toolbar">
          <h3 className="section-title">探索可爱伙伴</h3>
          <SearchFilter query={query} onChange={setQuery} role={role} animals={animals} />
        </div>


        {currentList.length > 0 ? (
          <>
            <div className="grid">
              {currentList.map((item) => (
                <AnimalCard key={item.id || item._id} item={item} onClick={setActive} />
              ))}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  上一页
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <p>暂无符合条件的动物信息</p>
          </div>
        )}
      </div>
      <div className="home-side">
        <Sidebar />
      </div>

      <FooterStats stats={chainStats} />

      <AnimalDetailModal item={active} onClose={() => setActive(null)} />
    </div>
  );
};

export default Home;


