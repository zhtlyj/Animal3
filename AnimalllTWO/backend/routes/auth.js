const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Animal = require('../models/Animal');
const { auth } = require('../middleware/auth');

const router = express.Router();

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    用户注册
// @access  Public
router.post('/register', [
  body('userId').notEmpty().withMessage('用户ID不能为空'),
  body('phone').isMobilePhone().withMessage('请输入有效的手机号'),
  body('email').isEmail().withMessage('请输入有效的邮箱'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('userType').isIn(['游客', '救助组织', '领养人', '捐赠者']).withMessage('用户类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { userId, phone, email, password, userType } = req.body;

    // 检查用户ID是否已存在
    const existingUserById = await User.findOne({ userId });
    if (existingUserById) {
      return res.status(400).json({
        success: false,
        message: '用户ID已存在，请选择其他ID'
      });
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册，请使用其他邮箱'
      });
    }

    // 创建新用户
    const user = new User({
      userId,
      phone,
      email,
      password,
      userType
    });

    await user.save();

    // 计算用户统计数据
    const stats = await calculateUserStats(user.userId, user.userType);

    // 生成令牌
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          phone: user.phone,
          email: user.email,
          userType: user.userType,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        stats,
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/auth/login
// @desc    用户登录
// @access  Public
router.post('/login', [
  body('userId').notEmpty().withMessage('用户ID不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  body('userType').isIn(['游客', '救助组织', '领养人', '捐赠者']).withMessage('用户类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { userId, password, userType } = req.body;

    // 查找用户
    const user = await User.findOne({ userId, userType });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户ID或身份类型不正确'
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '密码错误'
      });
    }

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    // 更新最后登录时间
    await user.updateLastLogin();

    // 计算用户统计数据
    const stats = await calculateUserStats(user.userId, user.userType);

    // 生成令牌
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          userId: user.userId,
          phone: user.phone,
          email: user.email,
          userType: user.userType,
          walletAddress: user.walletAddress,
          profile: user.profile,
          avatar: user.avatar,
          lastLogin: user.lastLogin
        },
        stats,
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   GET /api/auth/me
// @desc    获取当前用户信息
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // 计算用户统计数据
    const stats = await calculateUserStats(req.user._id, req.user.userType);

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          userId: req.user.userId,
          phone: req.user.phone,
          email: req.user.email,
          userType: req.user.userType,
          walletAddress: req.user.walletAddress,
          profile: req.user.profile,
          avatar: req.user.avatar,
          organization: req.user.organization,
          address: req.user.address,
          description: req.user.description,
          website: req.user.website,
          contactPerson: req.user.contactPerson,
          establishedDate: req.user.establishedDate,
          lastLogin: req.user.lastLogin,
          createdAt: req.user.createdAt
        },
        stats: stats
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    更新用户资料
// @access  Private
router.put('/profile', auth, [
  body('profile.name').optional().trim(),
  body('profile.bio').optional().trim(),
  body('profile.location').optional().trim(),
  body('walletAddress').optional().trim()
], async (req, res) => {
  try {
    const { profile, walletAddress } = req.body;
    const updateData = {};

    if (profile) {
      updateData.profile = { ...req.user.profile, ...profile };
    }
    if (walletAddress) {
      updateData.walletAddress = walletAddress;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: '资料更新成功',
      data: { user }
    });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   PUT /api/auth/update
// @desc    更新用户信息
// @access  Private
router.put('/update', auth, [
  body('userId').optional().notEmpty().withMessage('用户ID不能为空'),
  body('email').optional().isEmail().withMessage('请输入有效的邮箱'),
  body('phone').optional().isMobilePhone().withMessage('请输入有效的手机号'),
  body('organization').optional().isString().withMessage('组织名称必须是字符串'),
  body('address').optional().isString().withMessage('地址必须是字符串'),
  body('description').optional().isString().withMessage('描述必须是字符串'),
  body('website').optional().custom((value) => {
    if (value && value.trim() !== '') {
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('请输入有效的网址');
      }
    }
    return true;
  }),
  body('contactPerson').optional().isString().withMessage('联系人必须是字符串'),
  body('establishedDate').optional().custom((value) => {
    if (value !== undefined && value !== null && value !== '') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('请输入有效的日期');
      }
    }
    return true;
  }),
  body('avatar').optional().isString().withMessage('头像必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const {
      userId,
      email,
      phone,
      organization,
      address,
      description,
      website,
      contactPerson,
      establishedDate,
      avatar
    } = req.body;

    // 构建更新对象
    const updateData = {};
    
    if (userId !== undefined) updateData.userId = userId;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (organization !== undefined) updateData.organization = organization;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (website !== undefined) updateData.website = website || '';
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (establishedDate !== undefined) {
      // 处理日期：如果是空字符串或null，设置为null；否则转换为Date对象
      if (establishedDate === '' || establishedDate === null) {
        updateData.establishedDate = null;
      } else {
        const date = new Date(establishedDate);
        if (!isNaN(date.getTime())) {
          updateData.establishedDate = date;
        } else {
          return res.status(400).json({
            success: false,
            message: '成立时间格式无效'
          });
        }
      }
    }
    if (avatar !== undefined) updateData.avatar = avatar;

    // 如果更新userId，检查是否已存在
    if (userId && userId !== req.user.userId) {
      const existingUser = await User.findOne({ userId });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户ID已存在，请选择其他ID'
        });
      }
    }

    // 如果更新email，检查是否已存在
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在，请选择其他邮箱'
        });
      }
    }

    // 更新用户信息
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 计算用户统计数据
    const stats = await calculateUserStats(updatedUser._id, updatedUser.userType);

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: updatedUser,
        stats: stats
      }
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 计算用户统计数据
const calculateUserStats = async (userId, userType) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        registrationDays: 0,
        publishedAnimals: 0,
        successfulAdoptions: 0,
        adoptionApplications: 0,
        donationCount: 0
      };
    }

    // 计算注册天数
    const registrationDays = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));

    let stats = {
      registrationDays: registrationDays
    };

    if (userType === '救助组织') {
      // 救助组织统计
      const publishedAnimals = await Animal.countDocuments({ publisher: userId });
      const successfulAdoptions = await Animal.countDocuments({ 
        publisher: userId, 
        status: '已领养' 
      });

      stats = {
        ...stats,
        publishedAnimals: publishedAnimals,
        successfulAdoptions: successfulAdoptions
      };
    } else if (userType === '领养人') {
      // 领养人统计
      const adoptionApplications = await Animal.countDocuments({ 
        'adoptionApplications.applicant': userId 
      });
      
      // 这里需要根据实际的捐赠模型来计算捐赠次数
      // 暂时设为0，需要根据实际的捐赠模型来实现
      const donationCount = 0;

      stats = {
        ...stats,
        adoptionApplications: adoptionApplications,
        donationCount: donationCount
      };
    }

    return stats;
  } catch (error) {
    console.error('计算用户统计数据错误:', error);
    return {
      registrationDays: 0,
      publishedAnimals: 0,
      successfulAdoptions: 0,
      adoptionApplications: 0,
      donationCount: 0
    };
  }
};

module.exports = router;
