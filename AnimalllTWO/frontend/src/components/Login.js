import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    userType: '游客'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, userTypes } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.userId, formData.password, formData.userType);
      
      if (result.success) {
        // 登录成功后直接跳转到首页
        navigate('/home');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">欢迎回来</h1>
        <p className="auth-subtitle">登录到动物保护公益与领养平台</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userType" className="form-label">
            用户身份
          </label>
          <select
            id="userType"
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className="form-select"
            required
          >
            {Object.entries(userTypes).map(([key, value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="userId" className="form-label">
            用户ID
          </label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            className="form-input"
            placeholder="请输入您的用户ID"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            密码
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="请输入您的密码"
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>

      <div className="auth-link">
        还没有账户？ <Link to="/register">立即注册</Link>
      </div>
    </div>
  );
};

export default Login;
