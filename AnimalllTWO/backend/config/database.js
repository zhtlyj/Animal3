const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI =  'mongodb://127.0.0.1:27017/animal_protection';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    console.log(`数据库名称: ${conn.connection.name}`);
    
    // 自动创建集合和索引
    await createCollectionsAndIndexes();
    
  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 自动创建集合和索引
const createCollectionsAndIndexes = async () => {
  try {
    // 导入所有模型以确保它们被注册
    require('../models/User');
    require('../models/Animal');
    require('../models/Donation');
    require('../models/Project');
    
    // 确保所有索引都被创建
    await mongoose.connection.db.collection('users').createIndex({ userId: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ userType: 1 });
    
    await mongoose.connection.db.collection('animals').createIndex({ species: 1, status: 1 });
    await mongoose.connection.db.collection('animals').createIndex({ city: 1 });
    await mongoose.connection.db.collection('animals').createIndex({ publisher: 1 });
    await mongoose.connection.db.collection('animals').createIndex({ createdAt: -1 });
    
    await mongoose.connection.db.collection('donations').createIndex({ donor: 1, createdAt: -1 });
    await mongoose.connection.db.collection('donations').createIndex({ project: 1 });
    await mongoose.connection.db.collection('donations').createIndex({ animal: 1 });
    await mongoose.connection.db.collection('donations').createIndex({ status: 1 });
    
    await mongoose.connection.db.collection('projects').createIndex({ creator: 1 });
    await mongoose.connection.db.collection('projects').createIndex({ status: 1 });
    await mongoose.connection.db.collection('projects').createIndex({ type: 1 });
    await mongoose.connection.db.collection('projects').createIndex({ createdAt: -1 });
    
    console.log('✅ 数据库集合和索引创建完成');
    
    // 清理旧的初始动物数据
    await cleanupOldData();
    
    // 插入初始数据（如果数据库为空）
    await seedInitialData();
    
  } catch (error) {
    console.error('创建集合和索引失败:', error.message);
  }
};

// 清理旧的初始动物数据
const cleanupOldData = async () => {
  try {
    const Animal = mongoose.model('Animal');
    
    // 删除名为"豆包"和"小橘"的动物数据
    const result = await Animal.deleteMany({
      name: { $in: ['豆包', '小橘'] }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🗑️  已删除 ${result.deletedCount} 条旧的初始动物数据（豆包、小橘）`);
    }
  } catch (error) {
    console.error('清理旧数据失败:', error.message);
  }
};

// 插入初始数据
const seedInitialData = async () => {
  try {
    const User = mongoose.model('User');
    const Animal = mongoose.model('Animal');
    const Project = mongoose.model('Project');
    
    // 检查是否已有数据
    const userCount = await User.countDocuments();
    const animalCount = await Animal.countDocuments();
    const projectCount = await Project.countDocuments();
    
    if (userCount === 0) {
      console.log('📝 插入初始用户数据...');
      
      // 创建示例用户
      const sampleUsers = [
        {
          userId: 'admin001',
          phone: '13800138000',
          email: 'admin@animal-protection.com',
          password: 'admin123456',
          userType: '救助组织',
          profile: {
            name: '管理员',
            bio: '动物保护平台管理员'
          }
        },
        {
          userId: 'adopter001',
          phone: '13800138001',
          email: 'adopter@example.com',
          password: 'adopter123456',
          userType: '领养人',
          profile: {
            name: '爱心领养人',
            bio: '热爱小动物，希望给它们一个温暖的家'
          }
        },
        {
          userId: 'donor001',
          phone: '13800138002',
          email: 'donor@example.com',
          password: 'donor123456',
          userType: '捐赠者',
          profile: {
            name: '爱心捐赠者',
            bio: '支持动物保护事业'
          }
        }
      ];
      
      await User.insertMany(sampleUsers);
      console.log('✅ 初始用户数据插入完成');
    }
    
    // 不再插入初始动物数据
    console.log('跳过初始动物数据插入');
    
    if (projectCount === 0) {
      console.log('📝 插入初始项目数据...');
      
      // 获取管理员用户ID
      const adminUser = await User.findOne({ userId: 'admin001' });
      
      if (adminUser) {
        const sampleProjects = [
          {
            title: '流浪动物救助基金',
            description: '为流浪动物提供医疗救助、食物和庇护所',
            goal: 50000,
            type: '救助',
            creator: adminUser._id,
            tags: ['救助', '医疗', '食物'],
            images: [
              'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1400&auto=format&fit=crop'
            ]
          },
          {
            title: '动物医疗设备采购',
            description: '购买先进的医疗设备，提高动物救治水平',
            goal: 30000,
            type: '医疗',
            creator: adminUser._id,
            tags: ['医疗', '设备', '救治'],
            images: [
              'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?q=80&w=1400&auto=format&fit=crop'
            ]
          }
        ];
        
        await Project.insertMany(sampleProjects);
        console.log('✅ 初始项目数据插入完成');
      }
    }
    
    console.log('🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('插入初始数据失败:', error.message);
  }
};

// 更新咪咪状态为已领养
const updateMimiToAdopted = async () => {
  try {
    const Animal = mongoose.model('Animal');
    const animal = await Animal.findOne({ name: '咪咪' });
    
    if (animal && animal.status !== '已领养') {
      animal.status = '已领养';
      animal.history.push({
        type: '状态更新',
        at: new Date(),
        details: '手动更新状态为已领养'
      });
      await animal.save();
      console.log('✅ 咪咪状态已更新为"已领养"');
    } else if (animal) {
      console.log('ℹ️  咪咪状态已经是"已领养"');
    } else {
      console.log('⚠️  未找到名为"咪咪"的动物');
    }
  } catch (error) {
    console.error('更新咪咪状态失败:', error);
  }
};

module.exports = { connectDB, updateMimiToAdopted };
