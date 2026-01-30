const express = require('express');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Project = require('../models/Project');
const Animal = require('../models/Animal');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/donations/projects
// @desc    获取捐赠项目列表
// @access  Public
router.get('/projects', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status = 'active' 
    } = req.query;

    const query = { isPublic: true };
    if (type) query.type = type;
    if (status) query.status = status;

    const projects = await Project.find(query)
      .populate('creator', 'userId userType profile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('获取项目列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   GET /api/donations/projects/:id
// @desc    获取单个项目详情
// @access  Public
router.get('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('creator', 'userId userType profile');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('获取项目详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/donations/projects
// @desc    创建捐赠项目
// @access  Private (仅救助组织)
router.post('/projects', auth, requireRole(['救助组织']), [
  body('title').notEmpty().withMessage('项目标题不能为空'),
  body('description').notEmpty().withMessage('项目描述不能为空'),
  body('goal').isNumeric().withMessage('目标金额必须是数字'),
  body('type').isIn(['救助', '医疗', '设施', '教育', '其他']).withMessage('项目类型无效')
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
      title,
      description,
      goal,
      type,
      images,
      tags,
      deadline
    } = req.body;

    const project = new Project({
      title,
      description,
      goal,
      type,
      images: images || [],
      tags: tags || [],
      deadline,
      creator: req.user._id
    });

    await project.save();
    await project.populate('creator', 'userId userType profile');

    res.status(201).json({
      success: true,
      message: '项目创建成功',
      data: { project }
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   PUT /api/donations/projects/:id
// @desc    更新项目信息（包括区块链信息）
// @access  Private (仅项目创建者)
router.put('/projects/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查权限 - 只有创建者可以更新
    if (project.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此项目'
      });
    }

    const updateData = req.body;
    
    // 清理不允许修改的字段
    delete updateData.creator;
    delete updateData._id;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // 允许更新的字段
    const allowedFields = ['title', 'description', 'goal', 'type', 'images', 'tags', 'deadline', 'status', 'blockchain'];
    const cleanedData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        cleanedData[field] = updateData[field];
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: cleanedData },
      { new: true, runValidators: true }
    ).populate('creator', 'userId userType profile');

    res.json({
      success: true,
      message: '项目更新成功',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('更新项目错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/donations
// @desc    进行捐赠
// @access  Private
router.post('/', auth, [
  body('amount').isNumeric().withMessage('捐赠金额必须是数字'),
  body('method').isIn(['支付宝', '微信', '银行卡', '加密货币']).withMessage('支付方式无效'),
  body('projectId').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return /^[0-9a-fA-F]{24}$/.test(value);
  }).withMessage('项目ID无效'),
  body('animalId').optional().isMongoId().withMessage('动物ID无效')
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
      amount,
      method,
      projectId,
      animalId,
      note,
      isAnonymous = false,
      txHash,  // 区块链交易哈希（如果提供）
      blockchainDonationId  // 链上捐赠ID（如果提供）
    } = req.body;

    // 验证项目或动物存在
    if (projectId && projectId !== '') {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }
    }

    if (animalId) {
      const animal = await Animal.findById(animalId);
      if (!animal) {
        return res.status(404).json({
          success: false,
          message: '动物信息不存在'
        });
      }
    }

    // 如果有区块链交易哈希，使用它；否则生成模拟交易哈希
    const finalTxHash = txHash || ('0x' + Math.random().toString(16).substr(2, 8) + Date.now().toString(16));

    // 创建捐赠记录
    const donation = new Donation({
      donor: req.user._id,
      amount,
      method,
      project: projectId && projectId !== '' ? projectId : null,
      animal: animalId,
      note,
      isAnonymous,
      status: txHash ? 'completed' : 'pending', // 如果有区块链交易，标记为已完成
      transaction: {
        txHash: finalTxHash,
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        gasUsed: Math.floor(Math.random() * 50000) + 21000,
        blockchainDonationId: blockchainDonationId || null  // 保存链上捐赠ID
      }
    });

    await donation.save();

    // 更新项目金额
    if (projectId && projectId !== '') {
      await Project.findByIdAndUpdate(projectId, {
        $inc: { currentAmount: amount }
      });
    }

    res.status(201).json({
      success: true,
      message: '捐赠成功',
      data: { 
        donation,
        transaction: donation.transaction,
        txHash: donation.transaction.txHash
      }
    });
  } catch (error) {
    console.error('捐赠错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   GET /api/donations/history
// @desc    获取捐赠历史
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const donations = await Donation.find({ donor: req.user._id })
      .populate('project', 'title type')
      .populate('animal', 'name species')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments({ donor: req.user._id });

    res.json({
      success: true,
      data: {
        donations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('获取捐赠历史错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   GET /api/donations/stats
// @desc    获取捐赠统计
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalDonations = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalProjects = await Project.countDocuments({ status: 'active' });
    const totalAnimals = await Animal.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        totalDonations: totalDonations[0]?.total || 0,
        totalProjects,
        totalAnimals
      }
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
