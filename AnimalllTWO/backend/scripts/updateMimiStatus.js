const mongoose = require('mongoose');
const path = require('path');

// 确保从正确的目录运行
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const Animal = require(path.join(projectRoot, 'models', 'Animal'));

// 连接数据库
const mongoURI = 'mongodb://127.0.0.1:27017/animal_protection';

const updateMimiStatus = async () => {
  try {
    // 连接数据库
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB 连接成功');

    // 查找名为"咪咪"的动物
    const animal = await Animal.findOne({ name: '咪咪' });

    if (!animal) {
      console.log('❌ 未找到名为"咪咪"的动物');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('📋 找到动物:', {
      id: animal._id,
      name: animal.name,
      当前状态: animal.status,
      城市: animal.city,
      种类: animal.species
    });

    // 更新状态为"已领养"
    animal.status = '已领养';
    
    // 添加历史记录
    animal.history.push({
      type: '状态更新',
      at: new Date(),
      details: '手动更新状态为已领养'
    });

    // 保存更改
    await animal.save();

    console.log('✅ 动物状态已更新为"已领养"');
    console.log('📋 更新后的信息:', {
      id: animal._id,
      name: animal.name,
      新状态: animal.status
    });

    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 更新失败:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// 运行脚本
updateMimiStatus();

