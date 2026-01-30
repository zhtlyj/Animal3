import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { animalsAPI } from '../services/api';
import BackButton from '../components/BackButton';

const RescueAnimal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ organizationName: '', phone: '', message: '' });
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 从后端加载动物信息
  useEffect(() => {
    const loadAnimal = async () => {
      try {
        setLoading(true);
        const response = await animalsAPI.getAnimalById(id);
        if (response.success) {
          setItem(response.data.animal);
        } else {
          setMsg('未找到该动物信息');
        }
      } catch (error) {
        console.error('加载动物信息失败:', error);
        setMsg('加载动物信息失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadAnimal();
    }
  }, [id]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="error-message">请先登录</div>
        <button className="auth-button" onClick={() => navigate('/login')}>去登录</button>
      </div>
    );
  }

  if (user.userType !== '救助组织') {
    return (
      <div className="auth-container">
        <div className="error-message">仅救助组织可提交救助申请</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-message">加载中...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="auth-container">
        <div className="error-message">{msg || '未找到该动物'}</div>
      </div>
    );
  }

  if (item.status !== '救助中' && item.status !== '紧急求助') {
    return (
      <div className="auth-container">
        <div className="error-message">该动物当前不需要救助</div>
        <button className="auth-button" onClick={() => navigate(-1)}>返回</button>
      </div>
    );
  }

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      const response = await animalsAPI.applyRescue({
        animalId: id,
        profile: { 
          organizationName: form.organizationName || user.organization || user.userId, 
          phone: form.phone || user.phone
        },
        message: form.message
      });
      
      if (response.success) {
        setMsg('救助申请已提交成功！发布者将在申请管理页面审核您的申请。');
        setForm({ organizationName: '', phone: '', message: '' });
        
        // 3秒后跳转到首页
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      } else {
        setMsg(response.message || '提交失败，请重试');
      }
    } catch (err) {
      setMsg(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">申请救助：{item.name}</h1>
          <p className="auth-subtitle">请填写组织信息并说明您的救助计划</p>
        </div>

        {msg && <div className={msg.includes('已提交') ? 'success-message' : 'error-message'}>{msg}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">组织名称</label>
            <input 
              className="form-input" 
              name="organizationName" 
              value={form.organizationName} 
              onChange={onChange}
              placeholder={user.organization || user.userId}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">联系电话</label>
            <input 
              className="form-input" 
              name="phone" 
              value={form.phone} 
              onChange={onChange}
              placeholder={user.phone || ''}
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">救助说明</label>
            <textarea 
              className="form-input" 
              name="message" 
              value={form.message} 
              onChange={onChange} 
              rows={5} 
              placeholder="请详细说明您的救助计划、救助能力、救助时间安排等..."
              required 
            />
          </div>
          <button className={`auth-button ${submitting ? 'loading' : ''}`} disabled={submitting}>
            {submitting ? '提交中...' : '提交救助申请'}
          </button>
        </form>
      </div>
      <BackButton />
    </>
  );
};

export default RescueAnimal;




