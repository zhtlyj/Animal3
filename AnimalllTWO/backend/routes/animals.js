const express = require('express');
const { body, validationResult } = require('express-validator');
const Animal = require('../models/Animal');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// 测试路由
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Animals API 工作正常',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/animals
// @desc    获取动物列表
// @access  Public (可选认证)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      species, 
      status, 
      city, 
      search 
    } = req.query;

    const query = { isActive: true };

    // 筛选条件
    if (species) query.species = species;
    if (status) query.status = status;
    if (city) query.city = city;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const animals = await Animal.find(query)
      .populate('publisher', 'userId userType profile')
      .populate('adopter', 'userId userType profile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Animal.countDocuments(query);

    // 如果用户已登录，添加收藏和点赞状态
    let userId = null;
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production');
        const user = await User.findById(decoded.id).select('_id');
        if (user) {
          userId = user._id;
        }
      }
    } catch (authError) {
      // 认证失败不影响获取动物列表，只是不返回收藏状态
      console.log('获取用户信息失败（可选）:', authError.message);
    }

    // 为每只动物添加收藏、点赞和领养状态
    const animalsWithStatus = animals.map(animal => {
      const animalObj = animal.toObject();
      if (userId) {
        animalObj.isFavorited = animal.favorites && animal.favorites.some(
          favId => favId.toString() === userId.toString()
        );
        animalObj.isLiked = animal.likes && animal.likes.some(
          likeId => likeId.toString() === userId.toString()
        );
        // 检查是否是当前用户领养的动物
        // 处理 populate 后的 adopter 对象
        if (animal.adopter) {
          const adopterId = animal.adopter._id ? animal.adopter._id.toString() : animal.adopter.toString();
          animalObj.isMyAnimal = adopterId === userId.toString();
        } else {
          animalObj.isMyAnimal = false;
        }
      } else {
        animalObj.isFavorited = false;
        animalObj.isLiked = false;
        animalObj.isMyAnimal = false;
      }
      return animalObj;
    });

    res.json({
      success: true,
      data: {
        animals: animalsWithStatus,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('获取动物列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   GET /api/animals/applications
// @desc    获取申请管理数据（救助组织）
// @access  Private (仅救助组织)
// 注意：这个路由必须在 /:id 之前，否则会被误匹配
router.get('/applications', auth, async (req, res) => {
  try {
    console.log('申请管理API被调用');
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: '用户未登录' 
      });
    }
    
    if (user.userType !== '救助组织') {
      return res.status(403).json({ 
        success: false,
        error: '只有救助组织可以访问申请管理' 
      });
    }

    console.log('用户ID:', user._id);
    console.log('用户类型:', user.userType);
    console.log('用户ID类型:', typeof user._id, user._id.toString());

    // 获取该救助组织发布的动物的所有申请（只获取未删除的动物）
    const animals = await Animal.find({ 
      publisher: user._id,
      isActive: true  // 只获取未删除的动物
    })
      .populate({
        path: 'adoptionApplications.applicant',
        select: 'userId userType email phone profile'
      })
      .populate('publisher', 'userId userType')
      .sort({ createdAt: -1 });

    console.log('找到的动物数量:', animals.length);
    
    // 调试：打印每个动物的publisher信息
    animals.forEach((animal, index) => {
      const pubId = animal.publisher?._id || animal.publisher;
      console.log(`动物 ${index + 1}:`, {
        name: animal.name,
        publisherId: pubId,
        publisherIdString: pubId?.toString() || pubId,
        publisherType: typeof pubId,
        applicationsCount: animal.adoptionApplications?.length || 0,
        applications: animal.adoptionApplications?.map(app => ({
          applicant: app.applicant?._id || app.applicant,
          applicantName: app.applicantName,
          status: app.status
        }))
      });
    });

    const applications = [];
    animals.forEach(animal => {
      // 确保动物未被删除
      if (!animal.isActive) {
        console.log('跳过已删除的动物:', animal.name);
        return;
      }
      
      if (animal.adoptionApplications && animal.adoptionApplications.length > 0) {
        animal.adoptionApplications.forEach(app => {
          applications.push({
            id: `${animal._id}-${app.applicant._id || app.applicant}`,
            animalId: animal._id,
            animalName: animal.name,
            animalImage: animal.media?.[0] || animal.cover || '',
            animalStatus: animal.status,
            applicantId: app.applicant._id || app.applicant,
            applicantName: app.applicantName,
            applicantPhone: app.applicantPhone,
            applicantEmail: app.applicantEmail,
            message: app.message,
            status: app.status,
            applicationDate: app.applicationDate
          });
        });
      }
    });

    console.log('找到的申请数量:', applications.length);

    res.json({ 
      success: true,
      applications 
    });
  } catch (error) {
    console.error('获取申请管理数据失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器错误' 
    });
  }
});

// @route   GET /api/animals/my-applications
// @desc    获取我的申请（领养人）
// @access  Private (仅领养人)
// 注意：这个路由必须在 /:id 之前，否则会被误匹配
router.get('/my-applications', auth, async (req, res) => {
  try {
    console.log('获取我的申请API被调用');
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: '用户未登录' 
      });
    }
    
    if (user.userType !== '领养人') {
      return res.status(403).json({ 
        success: false,
        error: '只有领养人可以查看申请记录' 
      });
    }

    console.log('领养人ID:', user._id);
    console.log('领养人ID类型:', typeof user._id, user._id.toString());

    // 查找所有包含该领养人申请的动物
    // 使用多种查询方式确保能找到数据
    const userId = user._id;
    const userIdString = userId.toString();
    
    // 只查找未删除的动物
    let animals = await Animal.find({
      'adoptionApplications.applicant': userId,
      isActive: true  // 只获取未删除的动物
    })
      .populate('publisher', 'userId userType profile')
      .sort({ createdAt: -1 });

    console.log('直接查询找到的动物数量:', animals.length);
    
    // 如果没找到，尝试查找所有有申请的动物，然后过滤
    if (animals.length === 0) {
      console.log('尝试查找所有有申请的动物...');
      // 只查找未删除的动物
      const allAnimalsWithApplications = await Animal.find({
        'adoptionApplications.0': { $exists: true },
        isActive: true  // 只获取未删除的动物
      })
        .populate('publisher', 'userId userType profile')
        .sort({ createdAt: -1 });
      
      console.log('所有有申请的动物数量:', allAnimalsWithApplications.length);
      
      // 过滤出当前用户的申请，并排除已删除的动物
      animals = allAnimalsWithApplications.filter(animal => {
        // 排除已删除的动物
        if (!animal.isActive) {
          return false;
        }
        
        if (animal.adoptionApplications && animal.adoptionApplications.length > 0) {
          return animal.adoptionApplications.some(app => {
            const appApplicantId = app.applicant?.toString() || app.applicant?.toString();
            return appApplicantId === userIdString || appApplicantId === userId.toString();
          });
        }
        return false;
      });
      
      console.log('过滤后找到的动物数量:', animals.length);
    }

    const applications = [];
    animals.forEach(animal => {
      // 确保动物未被删除
      if (!animal.isActive) {
        console.log('跳过已删除的动物:', animal.name);
        return;
      }
      
      if (animal.adoptionApplications && animal.adoptionApplications.length > 0) {
        animal.adoptionApplications.forEach(app => {
          // 只包含当前用户的申请
          const appApplicantId = app.applicant?.toString() || app.applicant?.toString();
          if (appApplicantId === userIdString || appApplicantId === userId.toString()) {
            console.log('找到申请:', {
              animalName: animal.name,
              applicantName: app.applicantName,
              status: app.status
            });
            applications.push({
              id: `${animal._id}-${app.applicant?._id || app.applicant || userIdString}`,
              animalId: animal._id,
              animalName: animal.name,
              animalSpecies: animal.species,
              animalImage: animal.media?.[0] || animal.cover || '',
              animalStatus: animal.status,
              animalCity: animal.city,
              applicantId: app.applicant?._id || app.applicant || userId,
              applicantName: app.applicantName,
              applicantPhone: app.applicantPhone,
              applicantEmail: app.applicantEmail,
              message: app.message,
              status: app.status,
              applicationDate: app.applicationDate,
              publisherName: animal.publisher?.userId || '未知',
              publisherType: animal.publisher?.userType || '未知',
              blockchain: app.blockchain || {}
            });
          }
        });
      }
    });

    console.log('找到的申请数量:', applications.length);

    // 即使没有申请，也返回成功，但applications为空数组
    res.json({ 
      success: true,
      applications: applications || [],
      message: applications.length === 0 ? '您还没有提交任何领养申请' : '获取成功'
    });
  } catch (error) {
    console.error('获取我的申请失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ 
      success: false,
      error: error.message || '服务器错误',
      applications: []
    });
  }
});

// @route   GET /api/animals/:id
// @desc    获取单个动物详情
// @access  Public (可选认证)
router.get('/:id', async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id)
      .populate('publisher', 'userId userType profile')
      .populate('adopter', 'userId userType profile');

    if (!animal || !animal.isActive) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    // 如果用户已登录，添加收藏和点赞状态
    let userId = null;
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production');
        const user = await User.findById(decoded.id).select('_id');
        if (user) {
          userId = user._id;
        }
      }
    } catch (authError) {
      // 认证失败不影响获取动物详情，只是不返回收藏状态
      console.log('获取用户信息失败（可选）:', authError.message);
    }

    const animalObj = animal.toObject();
    if (userId) {
      animalObj.isFavorited = animal.favorites && animal.favorites.some(
        favId => favId.toString() === userId.toString()
      );
      animalObj.isLiked = animal.likes && animal.likes.some(
        likeId => likeId.toString() === userId.toString()
      );
      // 检查是否是当前用户领养的动物
      // 处理 populate 后的 adopter 对象
      if (animal.adopter) {
        const adopterId = animal.adopter._id ? animal.adopter._id.toString() : animal.adopter.toString();
        animalObj.isMyAnimal = adopterId === userId.toString();
      } else {
        animalObj.isMyAnimal = false;
      }
    } else {
      animalObj.isFavorited = false;
      animalObj.isLiked = false;
      animalObj.isMyAnimal = false;
    }

    res.json({
      success: true,
      data: { animal: animalObj }
    });
  } catch (error) {
    console.error('获取动物详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/animals
// @desc    发布动物信息
// @access  Private (仅救助组织)
router.post('/', auth, requireRole(['救助组织']), [
  body('name').notEmpty().withMessage('动物名称不能为空'),
  body('species').isIn(['猫', '狗', '兔', '鸟', '爬宠', '其他']).withMessage('动物种类无效'),
  body('status').isIn(['可领养', '救助中', '已领养', '紧急求助']).withMessage('状态无效'),
  body('city').notEmpty().withMessage('城市不能为空'),
  body('description').notEmpty().withMessage('描述不能为空')
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
      name,
      species,
      status,
      city,
      age,
      cover,
      media,
      description,
      healthReport,
      adoptionRequirements
    } = req.body;

    // 生成数据库自增的 tokenId（如果区块链无法获取，使用这个）
    let dbTokenId = 1;
    try {
      // 查询所有已有 NFT tokenId 的动物，找到最大的 tokenId
      const animalsWithNFT = await Animal.find({
        'nft.tokenId': { $exists: true, $ne: '', $ne: null }
      }).select('nft.tokenId');
      
      if (animalsWithNFT && animalsWithNFT.length > 0) {
        // 找到所有有效的数字 tokenId
        const tokenIds = animalsWithNFT
          .map(a => a.nft?.tokenId)
          .filter(id => id && id !== '' && id !== 'null' && id !== 'unknown' && id !== 'undefined')
          .map(id => {
            const num = parseInt(id, 10);
            return isNaN(num) ? 0 : num;
          })
          .filter(num => num > 0);
        
        if (tokenIds.length > 0) {
          dbTokenId = Math.max(...tokenIds) + 1;
        }
      }
      
      console.log('📝 生成的数据库 tokenId:', dbTokenId);
    } catch (tokenIdError) {
      console.error('⚠️ 生成数据库 tokenId 失败，使用默认值 1:', tokenIdError);
    }

    const animal = new Animal({
      name,
      species,
      status,
      city,
      age,
      cover: cover || (media && media.length > 0 ? media[0] : ''),
      media: media || [],
      description,
      healthReport,
      adoptionRequirements,
      publisher: req.user._id,
      // 预先设置数据库 tokenId（如果区块链无法获取，使用这个）
      nft: {
        tokenId: dbTokenId.toString(),
        contractAddress: process.env.NFT_CONTRACT_ADDRESS || process.env.REACT_APP_CONTRACT_ADDRESS || '',
        metadataURI: '',
        txHash: ''
      },
      history: [{
        type: '发布',
        by: req.user._id,
        at: new Date(),
        details: '发布动物信息'
      }]
    });

    await animal.save();
    await animal.populate('publisher', 'userId userType profile');

    res.status(201).json({
      success: true,
      message: '动物信息发布成功',
      data: { animal }
    });
  } catch (error) {
    console.error('发布动物信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   PUT /api/animals/:id
// @desc    更新动物信息
// @access  Private (仅发布者)
router.put('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    console.log('=== 更新动物信息 ===');
    console.log('动物ID:', req.params.id);
    console.log('当前用户ID:', req.user._id.toString());
    console.log('动物发布者ID:', animal ? animal.publisher.toString() : 'null');
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    // 检查权限 - 比较publisher ObjectId
    const publisherId = animal.publisher.toString();
    const userId = req.user._id.toString();
    
    if (publisherId !== userId) {
      console.log('权限检查失败:', { publisherId, userId });
      return res.status(403).json({
        success: false,
        message: '无权限修改此动物信息'
      });
    }

    const updateData = req.body;
    console.log('接收到的更新数据:', JSON.stringify(updateData, null, 2));
    
    delete updateData.publisher; // 不允许修改发布者
    delete updateData._id;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // 清理不需要的字段
    const allowedFields = ['name', 'species', 'status', 'city', 'age', 'cover', 'media', 
                          'description', 'healthReport', 'adoptionRequirements', 'nft'];
    const cleanedData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        cleanedData[field] = updateData[field];
      }
    });
    
    // 特殊处理 nft 字段（如果是对象，需要完整保留）
    if (updateData.nft !== undefined) {
      cleanedData.nft = updateData.nft;
    }
    
    console.log('清理后的更新数据:', JSON.stringify(cleanedData, null, 2));

    const updatedAnimal = await Animal.findByIdAndUpdate(
      req.params.id,
      { $set: cleanedData },
      { new: true, runValidators: true }
    ).populate('publisher', 'userId userType profile');

    console.log('更新成功');
    res.json({
      success: true,
      message: '动物信息更新成功',
      data: { animal: updatedAnimal }
    });
  } catch (error) {
    console.error('更新动物信息错误:', error);
    console.error('错误详情:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 如果是验证错误，返回更详细的错误信息
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器错误'
    });
  }
});

// @route   DELETE /api/animals/:id
// @desc    删除动物信息
// @access  Private (仅发布者)
router.delete('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    console.log('=== 删除动物信息 ===');
    console.log('动物ID:', req.params.id);
    console.log('当前用户ID:', req.user._id.toString());
    console.log('当前用户信息:', { userId: req.user.userId, userType: req.user.userType });
    console.log('动物发布者ID:', animal ? animal.publisher.toString() : 'null');
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    // 检查权限 - 比较publisher ObjectId
    const publisherId = animal.publisher.toString();
    const userId = req.user._id.toString();
    
    if (publisherId !== userId) {
      console.log('权限检查失败:', { publisherId, userId, match: publisherId === userId });
      return res.status(403).json({
        success: false,
        message: '无权限删除此动物信息',
        debug: { publisherId, userId } // 临时调试信息
      });
    }

    // 软删除
    animal.isActive = false;
    await animal.save();

    console.log('删除成功');
    res.json({
      success: true,
      message: '动物信息删除成功'
    });
  } catch (error) {
    console.error('删除动物信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/animals/:id/like
// @desc    点赞/取消点赞动物
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    const userId = req.user._id;
    const isLiked = animal.likes.includes(userId);

    if (isLiked) {
      animal.likes.pull(userId);
    } else {
      animal.likes.push(userId);
    }

    await animal.save();

    res.json({
      success: true,
      message: isLiked ? '取消点赞成功' : '点赞成功',
      data: {
        isLiked: !isLiked,
        likesCount: animal.likes.length
      }
    });
  } catch (error) {
    console.error('点赞操作错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/animals/:id/favorite
// @desc    收藏/取消收藏动物
// @access  Private
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    const userId = req.user._id;
    const isFavorited = animal.favorites.includes(userId);

    if (isFavorited) {
      animal.favorites.pull(userId);
    } else {
      animal.favorites.push(userId);
    }

    await animal.save();

    res.json({
      success: true,
      message: isFavorited ? '取消收藏成功' : '收藏成功',
      data: {
        isFavorited: !isFavorited,
        favoritesCount: animal.favorites.length
      }
    });
  } catch (error) {
    console.error('收藏操作错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/animals/:id/adopt
// @desc    申请领养动物
// @access  Private (仅领养人)
router.post('/:id/adopt', auth, requireRole(['领养人']), [
  body('profile').notEmpty().withMessage('个人资料不能为空'),
  body('motivation').notEmpty().withMessage('领养动机不能为空')
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

    const animal = await Animal.findById(req.params.id)
      .populate('publisher', 'userId userType');
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    if (animal.status !== '可领养') {
      return res.status(400).json({
        success: false,
        message: '该动物当前不可领养'
      });
    }

    const { profile, motivation, blockchain } = req.body;
    
    console.log('=== 提交领养申请 ===');
    console.log('动物ID:', req.params.id);
    console.log('动物名称:', animal.name);
    console.log('发布者ID:', animal.publisher?._id || animal.publisher);
    console.log('发布者类型:', typeof animal.publisher);
    console.log('申请人ID:', req.user._id);
    console.log('申请资料:', profile);
    console.log('区块链信息:', blockchain);
    
    // 检查是否已经申请过
    const existingApplication = animal.adoptionApplications.find(
      app => app.applicant.toString() === req.user._id.toString()
    );
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: '您已经提交过领养申请了'
      });
    }

    // 获取用户信息
    const User = require('../models/User');
    const applicant = await User.findById(req.user._id);
    
    // 构建申请对象
    const applicationData = {
      applicant: req.user._id,
      applicantName: profile.realName || applicant.profile?.name || applicant.userId || '未知',
      applicantPhone: profile.phone || applicant.phone || '',
      applicantEmail: applicant.email || '',
      message: motivation,
      status: 'pending',
      applicationDate: new Date()
    };
    
    // 如果有区块链信息，添加到申请中
    if (blockchain) {
      applicationData.blockchain = {
        applicationId: blockchain.applicationId || null,
        txHash: blockchain.txHash || null,
        contractAddress: blockchain.contractAddress || null
      };
    }
    
    // 添加领养申请到adoptionApplications数组
    animal.adoptionApplications.push(applicationData);

    // 添加领养申请记录到history
    animal.history.push({
      type: '领养申请',
      by: req.user._id,
      at: new Date(),
      details: `申请领养，个人资料：${JSON.stringify(profile)}，领养动机：${motivation}`
    });

    await animal.save();
    
    // 重新加载动物数据以确保数据正确
    const savedAnimal = await Animal.findById(animal._id)
      .populate('publisher', 'userId userType')
      .populate('adoptionApplications.applicant', 'userId userType email');
    
    console.log('申请保存成功');
    console.log('动物发布者ID:', savedAnimal.publisher?._id || savedAnimal.publisher);
    console.log('申请数量:', savedAnimal.adoptionApplications.length);
    console.log('最新申请:', savedAnimal.adoptionApplications[savedAnimal.adoptionApplications.length - 1]);

    res.json({
      success: true,
      message: '领养申请提交成功',
      data: { animal: savedAnimal }
    });
  } catch (error) {
    console.error('领养申请错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/animals/:id/rescue
// @desc    申请救助动物
// @access  Private (仅救助组织)
router.post('/:id/rescue', auth, requireRole(['救助组织']), [
  body('profile').notEmpty().withMessage('组织资料不能为空'),
  body('message').notEmpty().withMessage('救助说明不能为空')
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

    const animal = await Animal.findById(req.params.id)
      .populate('publisher', 'userId userType');
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    // 检查动物状态是否为"救助中"或"紧急求助"
    if (animal.status !== '救助中' && animal.status !== '紧急求助') {
      return res.status(400).json({
        success: false,
        message: '该动物当前不需要救助'
      });
    }

    // 检查是否是自己发布的动物
    if (animal.publisher._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能救助自己发布的动物'
      });
    }

    const { profile, message } = req.body;
    
    console.log('=== 提交救助申请 ===');
    console.log('动物ID:', req.params.id);
    console.log('动物名称:', animal.name);
    console.log('发布者ID:', animal.publisher?._id || animal.publisher);
    console.log('救助组织ID:', req.user._id);
    console.log('组织资料:', profile);
    
    // 检查是否已经申请过
    const existingApplication = animal.rescueApplications.find(
      app => app.rescuer.toString() === req.user._id.toString()
    );
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: '您已经提交过救助申请了'
      });
    }

    // 获取用户信息
    const User = require('../models/User');
    const rescuer = await User.findById(req.user._id);
    
    // 添加救助申请到rescueApplications数组
    animal.rescueApplications.push({
      rescuer: req.user._id,
      rescuerName: profile.organizationName || rescuer.organization || rescuer.userId || '未知',
      rescuerPhone: profile.phone || rescuer.phone || '',
      rescuerEmail: rescuer.email || '',
      organization: profile.organizationName || rescuer.organization || '',
      message: message,
      status: 'pending',
      applicationDate: new Date()
    });

    // 添加救助申请记录到history
    animal.history.push({
      type: '救助申请',
      by: req.user._id,
      at: new Date(),
      details: `申请救助，组织资料：${JSON.stringify(profile)}，救助说明：${message}`
    });

    await animal.save();
    
    // 重新加载动物数据以确保数据正确
    const savedAnimal = await Animal.findById(animal._id)
      .populate('publisher', 'userId userType')
      .populate('rescueApplications.rescuer', 'userId userType email organization');
    
    console.log('救助申请保存成功');
    console.log('动物发布者ID:', savedAnimal.publisher?._id || savedAnimal.publisher);
    console.log('救助申请数量:', savedAnimal.rescueApplications.length);

    res.json({
      success: true,
      message: '救助申请提交成功',
      data: { animal: savedAnimal }
    });
  } catch (error) {
    console.error('救助申请错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 更新申请状态
router.put('/applications/:applicationId', auth, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: '用户未登录' 
      });
    }

    if (user.userType !== '救助组织') {
      return res.status(403).json({ 
        success: false,
        error: '只有救助组织可以更新申请状态' 
      });
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: '无效的状态值' 
      });
    }

    // 解析applicationId获取animalId和applicantId
    const [animalId, applicantId] = applicationId.split('-');
    
    const animal = await Animal.findOne({ 
      _id: animalId, 
      publisher: user._id 
    });

    if (!animal) {
      return res.status(404).json({ 
        success: false,
        error: '动物不存在或您没有权限' 
      });
    }

    // 更新申请状态
    const application = animal.adoptionApplications.find(
      app => app.applicant.toString() === applicantId
    );

    if (!application) {
      return res.status(404).json({ 
        success: false,
        error: '申请不存在' 
      });
    }

    const oldStatus = application.status;
    
    console.log('=== 更新申请状态 ===');
    console.log('申请ID:', applicationId);
    console.log('动物ID:', animal._id);
    console.log('动物名称:', animal.name);
    console.log('动物当前状态:', animal.status);
    console.log('申请旧状态:', oldStatus);
    console.log('申请新状态:', status);
    
    // 更新申请状态
    application.status = status;
    
    // 如果申请被通过，更新动物状态为"已领养"并设置领养者
    if (status === 'approved') {
      console.log('=== 申请被通过，开始更新动物状态 ===');
      console.log('更新前动物状态:', animal.status);
      console.log('更新前动物ID:', animal._id);
      console.log('申请人ID:', applicantId);
      
      // 使用 findByIdAndUpdate 确保更新成功
      const updateResult = await Animal.findByIdAndUpdate(
        animal._id,
        {
          $set: {
            status: '已领养',
            adopter: applicantId
          },
          $push: {
            history: {
              type: '领养成功',
              by: applicantId,
              at: new Date(),
              details: `领养申请已通过，领养人：${application.applicantName}`
            }
          }
        },
        { new: true, runValidators: true }
      );
      
      console.log('直接更新结果:', updateResult?.status);
      
      // 同时更新内存中的对象
      animal.status = '已领养';
      animal.adopter = applicantId;
      animal.history.push({
        type: '领养成功',
        by: applicantId,
        at: new Date(),
        details: `领养申请已通过，领养人：${application.applicantName}`
      });
      
      console.log('内存中动物状态:', animal.status);
      console.log('内存中领养者ID:', animal.adopter);
    }
    
    // 如果申请被拒绝，且动物状态是"已领养"，可能需要检查是否还有其他已通过的申请
    if (status === 'rejected' && animal.status === '已领养' && animal.adopter && animal.adopter.toString() === applicantId) {
      // 检查是否还有其他已通过的申请
      const hasOtherApproved = animal.adoptionApplications.some(app => 
        app.status === 'approved' && app.applicant.toString() !== applicantId
      );
      
      if (!hasOtherApproved) {
        // 没有其他已通过的申请，恢复动物状态
        animal.status = '可领养';
        animal.adopter = null;
        console.log('申请被拒绝，动物状态已恢复为可领养');
      }
    }
    
    // 保存动物数据（包括申请状态更新）
    await animal.save();
    console.log('=== 动物数据已保存到数据库 ===');
    console.log('保存后的动物状态:', animal.status);
    console.log('保存后的领养者:', animal.adopter);
    
    // 重新从数据库加载动物数据，确保获取最新状态
    const updatedAnimal = await Animal.findById(animal._id)
      .populate('publisher', 'userId userType')
      .populate('adopter', 'userId userType');

    console.log('=== 重新加载后的动物数据 ===');
    console.log('动物ID:', updatedAnimal._id);
    console.log('动物名称:', updatedAnimal.name);
    console.log('动物状态:', updatedAnimal.status);
    console.log('领养者:', updatedAnimal.adopter);
    
    // 如果申请被通过，强制验证并确保状态为"已领养"
    if (status === 'approved') {
      if (updatedAnimal.status !== '已领养') {
        console.error('❌ 错误：动物状态更新失败！');
        console.error('期望状态: 已领养');
        console.error('实际状态:', updatedAnimal.status);
        
        // 使用 findByIdAndUpdate 强制更新
        const forceUpdate = await Animal.findByIdAndUpdate(
          animal._id,
          { 
            $set: { 
              status: '已领养',
              adopter: applicantId
            } 
          },
          { new: true }
        );
        
        console.log('强制更新后的状态:', forceUpdate.status);
        
        if (forceUpdate.status !== '已领养') {
          console.error('❌ 严重错误：无法更新动物状态！');
          return res.status(500).json({
            success: false,
            error: '无法更新动物状态为已领养'
          });
        } else {
          console.log('✅ 动物状态已成功更新为已领养');
          // 重新加载
          const finalAnimal = await Animal.findById(animal._id)
            .populate('publisher', 'userId userType')
            .populate('adopter', 'userId userType');
          
          return res.json({ 
            success: true,
            message: '申请已通过，动物状态已更新为已领养',
            status: application.status,
            animal: finalAnimal
          });
        }
      } else {
        console.log('✅ 动物状态已正确更新为已领养');
      }
    }

    // 确保返回的动物数据包含最新状态
    const finalAnimal = await Animal.findById(animal._id)
      .populate('publisher', 'userId userType')
      .populate('adopter', 'userId userType');
    
    console.log('=== 最终返回的动物数据 ===');
    console.log('动物ID:', finalAnimal._id);
    console.log('动物名称:', finalAnimal.name);
    console.log('动物状态:', finalAnimal.status);
    console.log('领养者:', finalAnimal.adopter);

    res.json({ 
      success: true,
      message: status === 'approved' ? '申请已通过，动物状态已更新为已领养' : '申请状态更新成功',
      status: application.status,
      animal: finalAnimal
    });
  } catch (error) {
    console.error('更新申请状态失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器错误' 
    });
  }
});

// @route   POST /api/animals/:id/life-photos
// @desc    上传生活照（仅领养人）
// @access  Private (仅领养人)
router.post('/:id/life-photos', auth, requireRole(['领养人']), [
  body('photoUrl').notEmpty().withMessage('照片URL不能为空'),
  body('description').optional().isString()
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

    const animal = await Animal.findById(req.params.id);
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    // 检查是否是当前用户领养的动物
    if (!animal.adopter || animal.adopter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '您只能为自己领养的动物上传生活照'
      });
    }

    const { photoUrl, description } = req.body;

    animal.lifePhotos.push({
      url: photoUrl,
      description: description || '',
      uploadedAt: new Date()
    });

    await animal.save();

    res.json({
      success: true,
      message: '生活照上传成功',
      data: { animal }
    });
  } catch (error) {
    console.error('上传生活照错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   POST /api/animals/:id/mint-nft
// @desc    将动物信息上链（铸造NFT）
// @access  Private (仅发布者)
router.post('/:id/mint-nft', auth, async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    // 检查权限 - 只有发布者可以上链
    const publisherId = animal.publisher.toString();
    const userId = req.user._id.toString();
    
    if (publisherId !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有发布者可以将动物信息上链'
      });
    }

    // 检查是否已经上链
    if (animal.nft && animal.nft.tokenId) {
      return res.status(400).json({
        success: false,
        message: '该动物已经上链，无需重复操作'
      });
    }

    // 模拟NFT铸造（实际项目中应调用真实的区块链服务）
    // 生成模拟的NFT信息
    const nftData = {
      tokenId: Math.floor(Math.random() * 1_000_000).toString(),
      contractAddress: process.env.NFT_CONTRACT_ADDRESS || '0x' + Math.random().toString(16).slice(2).padEnd(40, '0'),
      metadataURI: `${process.env.API_URL || 'http://localhost:5000'}/api/animals/${animal._id}/metadata`,
      txHash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0')
    };

    // 更新动物信息，添加上链信息
    animal.nft = nftData;
    
    // 添加历史记录
    animal.history.push({
      type: '状态更新',
      by: req.user._id,
      at: new Date(),
      tx: nftData.txHash,
      details: `动物信息已上链，NFT Token ID: ${nftData.tokenId}`
    });

    await animal.save();
    await animal.populate('publisher', 'userId userType profile');

    res.json({
      success: true,
      message: '动物信息上链成功',
      data: { 
        animal,
        nft: nftData
      }
    });
  } catch (error) {
    console.error('上链错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// @route   DELETE /api/animals/:id/life-photos/:photoId
// @desc    删除生活照（仅领养人）
// @access  Private (仅领养人)
router.delete('/:id/life-photos/:photoId', auth, requireRole(['领养人']), async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    
    if (!animal) {
      return res.status(404).json({
        success: false,
        message: '动物信息不存在'
      });
    }

    // 检查是否是当前用户领养的动物
    if (!animal.adopter || animal.adopter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '您只能删除自己领养动物的生活照'
      });
    }

    const photoId = req.params.photoId;
    animal.lifePhotos = animal.lifePhotos.filter(
      photo => photo._id.toString() !== photoId
    );

    await animal.save();

    res.json({
      success: true,
      message: '生活照删除成功',
      data: { animal }
    });
  } catch (error) {
    console.error('删除生活照错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
