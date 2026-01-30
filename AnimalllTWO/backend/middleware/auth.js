const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '访问被拒绝，未提供令牌' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '令牌无效，用户不存在' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: '账户已被禁用' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(401).json({ 
      success: false, 
      message: '令牌无效' 
    });
  }
};

// 角色权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }

    next();
  };
};

module.exports = { auth, requireRole };
