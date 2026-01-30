import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    userId: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '游客'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, userTypes } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误和成功信息
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.userId.trim()) {
      setError('请输入用户ID');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('请输入电话号码');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('请输入邮箱地址');
      return false;
    }
    
    if (!formData.password) {
      setError('请输入密码');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    
    // 简单的手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('请输入有效的手机号码');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await register({
        userId: formData.userId,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        userType: formData.userType
      });
      
      if (result.success) {
        setSuccess('注册成功！正在跳转到登录页面...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1 className="auth-title">创建账户</h1>
        <p className="auth-subtitle">加入动物保护公益与领养平台</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
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
          <label htmlFor="phone" className="form-label">
            电话号码
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-input"
            placeholder="请输入您的手机号码"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            邮箱地址
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="请输入您的邮箱地址"
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
            placeholder="请输入密码（至少6位）"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            确认密码
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            placeholder="请再次输入密码"
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </form>

      <div className="auth-link">
        已有账户？ <Link to="/login">立即登录</Link>
      </div>
    </div>
  );
};

export default Register;

