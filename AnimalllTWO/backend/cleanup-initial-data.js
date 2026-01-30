const mongoose = require('mongoose');
const Animal = require('./models/Animal');

const mongoURI = 'mongodb://127.0.0.1:27017/animal_protection';

async function cleanup() {
  try {
    console.log('正在连接数据库...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 数据库连接成功');

    // 删除名为"豆包"和"小橘"的动物数据
    const result = await Animal.deleteMany({
      name: { $in: ['豆包', '小橘'] }
    });

    console.log(`✅ 已删除 ${result.deletedCount} 条初始动物数据`);
    console.log('清理完成！');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

cleanup();






