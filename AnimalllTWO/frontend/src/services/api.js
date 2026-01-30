// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 获取存储的token
const getToken = () => {
  return localStorage.getItem('token');
};

// 设置token
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 移除token
const removeToken = () => {
  localStorage.removeItem('token');
};

// 通用请求函数
const request = async (url, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
      // 如果有详细的验证错误信息，显示第一个错误
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].msg || data.message || '请求失败');
      }
      throw new Error(data.message || '请求失败');
    }

    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// 用户认证API
export const authAPI = {
  // 用户注册
  register: async (userData) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 用户登录
  login: async (loginData) => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    
    if (response.success && response.data.token) {
      setToken(response.data.token);
    }
    
    return response;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    return request('/auth/me');
  },

  // 更新用户资料
  updateProfile: async (profileData) => {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // 更新用户信息（包括头像）
  updateUser: async (userData) => {
    return request('/auth/update', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // 登出
  logout: () => {
    removeToken();
  },
};

// 动物相关API
export const animalsAPI = {
  // 获取动物列表
  getAnimals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/animals?${queryString}`);
  },

  // 获取单个动物详情
  getAnimalById: async (id) => {
    return request(`/animals/${id}`);
  },

  // 发布动物信息
  publishAnimal: async (animalData) => {
    return request('/animals', {
      method: 'POST',
      body: JSON.stringify(animalData),
    });
  },

  // 更新动物信息
  updateAnimal: async (id, animalData) => {
    return request(`/animals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(animalData),
    });
  },

  // 删除动物信息
  deleteAnimal: async (id) => {
    return request(`/animals/${id}`, {
      method: 'DELETE',
    });
  },

  // 点赞/取消点赞
  toggleLike: async (id) => {
    return request(`/animals/${id}/like`, {
      method: 'POST',
    });
  },

  // 收藏/取消收藏
  toggleFavorite: async (id) => {
    return request(`/animals/${id}/favorite`, {
      method: 'POST',
    });
  },

  // 申请领养
  applyAdoption: async (id, applicationData) => {
    return request(`/animals/${id}/adopt`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  // 申请管理相关
  getApplications: async () => {
    return request('/animals/applications');
  },

  // 获取我的申请（领养人）
  getMyApplications: async () => {
    return request('/animals/my-applications');
  },

  updateApplicationStatus: async (applicationId, status) => {
    return request(`/animals/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // 申请救助
  applyRescue: async ({ animalId, profile, message }) => {
    return request(`/animals/${animalId}/rescue`, {
      method: 'POST',
      body: JSON.stringify({ profile, message }),
    });
  },

  // 上传生活照
  uploadLifePhoto: async (id, photoData) => {
    return request(`/animals/${id}/life-photos`, {
      method: 'POST',
      body: JSON.stringify(photoData),
    });
  },

  // 删除生活照
  deleteLifePhoto: async (animalId, photoId) => {
    return request(`/animals/${animalId}/life-photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  // 将动物信息上链（铸造NFT）
  mintNFT: async (id) => {
    return request(`/animals/${id}/mint-nft`, {
      method: 'POST',
    });
  },
};

// 捐赠相关API
export const donationsAPI = {
  // 获取项目列表
  getProjects: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/donations/projects?${queryString}`);
  },

  // 获取单个项目详情
  getProjectById: async (id) => {
    return request(`/donations/projects/${id}`);
  },

  // 创建项目
  createProject: async (projectData) => {
    return request('/donations/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // 更新项目
  updateProject: async (id, projectData) => {
    return request(`/donations/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  // 进行捐赠
  makeDonation: async (donationData) => {
    return request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  },

  // 获取捐赠历史
  getDonationHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/donations/history?${queryString}`);
  },

  // 获取统计信息
  getStats: async () => {
    return request('/donations/stats');
  },
};

// 导出默认API对象
export default {
  auth: authAPI,
  animals: animalsAPI,
  donations: donationsAPI,
  setToken,
  getToken,
  removeToken,
};
