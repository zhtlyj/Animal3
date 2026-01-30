import React, { useMemo } from 'react';

const SearchFilter = ({ query, onChange, role, hideStatus = false, animals = [] }) => {
  // 从实际的动物数据中提取存在的种类
  const availableSpecies = useMemo(() => {
    const speciesSet = new Set();
    animals.forEach(animal => {
      if (animal.species) {
        speciesSet.add(animal.species);
      }
    });
    return Array.from(speciesSet).sort();
  }, [animals]);

  // 从实际的动物数据中提取存在的城市
  const availableCities = useMemo(() => {
    const citySet = new Set();
    animals.forEach(animal => {
      if (animal.city) {
        citySet.add(animal.city);
      }
    });
    return Array.from(citySet).sort();
  }, [animals]);

  // 从实际的动物数据中提取存在的状态
  const availableStatuses = useMemo(() => {
    const statusSet = new Set();
    animals.forEach(animal => {
      if (animal.status) {
        statusSet.add(animal.status);
      }
    });
    
    const statuses = Array.from(statusSet);
    
    // 按照优先级排序
    const order = ['可领养', '救助中', '已领养', '紧急求助'];
    return statuses.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [animals]);

  return (
    <div className="search-filter">
      <input
        className="search-input form-input"
        placeholder="搜索动物名称..."
        value={query.keyword || ''}
        onChange={(e) => onChange({ ...query, keyword: e.target.value })}
      />
      <select
        className="search-select form-select"
        value={query.species || ''}
        onChange={(e) => onChange({ ...query, species: e.target.value })}
        disabled={availableSpecies.length === 0}
      >
        <option value="">全部种类</option>
        {availableSpecies.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        className="search-select form-select"
        value={query.city || ''}
        onChange={(e) => onChange({ ...query, city: e.target.value })}
        disabled={availableCities.length === 0}
      >
        <option value="">全部地区</option>
        {availableCities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {!hideStatus && (
        <select
          className="search-select form-select"
          value={query.status || ''}
          onChange={(e) => onChange({ ...query, status: e.target.value })}
          disabled={availableStatuses.length === 0}
        >
          <option value="">全部状态</option>
          {availableStatuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SearchFilter;



