import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { animalsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AnimalsContext = createContext();

export const useAnimals = () => {
  const ctx = useContext(AnimalsContext);
  if (!ctx) throw new Error('useAnimals必须在AnimalsProvider内使用');
  return ctx;
};

export const AnimalsProvider = ({ children }) => {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [likes, setLikes] = useState({});
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(false);

  // 加载动物列表
  const loadAnimals = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      console.log('AnimalsContext: 开始加载动物列表...', user ? `用户: ${user._id || user.id}` : '未登录');
      console.log('AnimalsContext: 用户对象:', user);
      const response = await animalsAPI.getAnimals(params);
      if (response.success) {
        const animalsList = response.data.animals || [];
        console.log('AnimalsContext: 加载到', animalsList.length, '只动物');
        
        // 根据后端返回的数据初始化收藏和点赞状态
        const newFavorites = {};
        const newLikes = {};
        animalsList.forEach(animal => {
          const animalId = animal._id || animal.id;
          if (animalId) {
            // 使用后端返回的 isFavorited 和 isLiked 状态
            newFavorites[animalId] = animal.isFavorited || false;
            newLikes[animalId] = animal.isLiked || false;
          }
          console.log(`动物: ${animal.name}, 状态: ${animal.status}, 收藏: ${animal.isFavorited}, 点赞: ${animal.isLiked}`);
        });
        
        setFavorites(newFavorites);
        setLikes(newLikes);
        setAnimals(animalsList);
      } else {
        console.error('AnimalsContext: 加载失败', response.message);
      }
    } catch (error) {
      console.error('AnimalsContext: 加载动物列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 当用户切换时，清空收藏和点赞状态，并重新加载
  useEffect(() => {
    // 清空状态
    setFavorites({});
    setLikes({});
    // 重新加载动物列表（会使用新的用户身份）
    loadAnimals();
  }, [user?._id, loadAnimals]);

  const toggleLike = useCallback(async (id) => {
    try {
      const response = await animalsAPI.toggleLike(id);
      if (response.success) {
        setLikes((prev) => ({ ...prev, [id]: response.data.isLiked }));
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
    }
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const response = await animalsAPI.toggleFavorite(id);
      if (response.success) {
        setFavorites((prev) => ({ ...prev, [id]: response.data.isFavorited }));
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  }, []);

  // 更新单个动物的收藏和点赞状态（用于详情页）
  const updateAnimalStatus = useCallback((animal) => {
    if (!animal) return;
    const animalId = animal._id || animal.id;
    if (animalId) {
      setFavorites((prev) => ({ ...prev, [animalId]: animal.isFavorited || false }));
      setLikes((prev) => ({ ...prev, [animalId]: animal.isLiked || false }));
    }
  }, []);

  const publishAnimal = useCallback(async (animalData) => {
    try {
      const response = await animalsAPI.publishAnimal(animalData);
      if (response.success) {
        setAnimals((prev) => [response.data.animal, ...prev]);
        return response.data.animal;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('发布动物信息失败:', error);
      throw error;
    }
  }, []);

  const applyForAdoption = useCallback(async ({ animalId, profile, motivation, blockchain }) => {
    try {
      const response = await animalsAPI.applyAdoption(animalId, { profile, motivation, blockchain });
      if (response.success) {
        // 重新加载动物列表以获取最新状态
        await loadAnimals();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('领养申请失败:', error);
      throw error;
    }
  }, [loadAnimals]);

  const updateAnimal = useCallback(async (id, animalData) => {
    try {
      console.log('AnimalsContext - 调用更新API, ID:', id);
      const response = await animalsAPI.updateAnimal(id, animalData);
      console.log('AnimalsContext - API响应:', response);
      
      if (response.success) {
        const updatedAnimal = response.data.animal;
        console.log('AnimalsContext - 更新后的动物状态:', updatedAnimal.status);
        setAnimals((prev) => prev.map((animal) => {
          if (animal._id === id || animal.id === id) {
            console.log('AnimalsContext - 更新动物:', animal.name, '状态从', animal.status, '到', updatedAnimal.status);
            return updatedAnimal;
          }
          return animal;
        }));
        return updatedAnimal;
      }
      throw new Error(response.message || '更新失败');
    } catch (error) {
      console.error('更新动物信息失败:', error);
      throw error;
    }
  }, []);

  const deleteAnimal = useCallback(async (id) => {
    try {
      console.log('AnimalsContext - 调用删除API, ID:', id);
      const response = await animalsAPI.deleteAnimal(id);
      console.log('AnimalsContext - 删除API响应:', response);
      
      if (response.success) {
        // 从列表中移除已删除的动物（软删除，isActive=false）
        setAnimals((prev) => prev.filter((animal) => 
          (animal._id !== id && animal.id !== id) || !animal.isActive
        ));
        // 重新加载动物列表以确保数据同步
        await loadAnimals();
        return true;
      }
      throw new Error(response.message || '删除失败');
    } catch (error) {
      console.error('删除动物信息失败:', error);
      throw error;
    }
  }, [loadAnimals]);

  const findById = useCallback((id) => animals.find((a) => (a._id === id) || (a.id === id)), [animals]);

  const value = useMemo(() => ({ 
    animals, 
    likes, 
    favorites,
    loading,
    loadAnimals,
    toggleLike, 
    toggleFavorite,
    updateAnimalStatus,
    publishAnimal,
    updateAnimal,
    deleteAnimal,
    applyForAdoption, 
    findById 
  }), [animals, likes, favorites, loading, loadAnimals, toggleLike, toggleFavorite, updateAnimalStatus, publishAnimal, updateAnimal, deleteAnimal, applyForAdoption, findById]);

  return (
    <AnimalsContext.Provider value={value}>
      {children}
    </AnimalsContext.Provider>
  );
};


