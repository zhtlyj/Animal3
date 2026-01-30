const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, updateMimiToAdopted } = require('./config/database');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB().then(async () => {
  // 数据库连接成功后，更新咪咪状态
  await updateMimiToAdopted();
});

const app = express();

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/animals', require('./routes/animals'));
app.use('/api/donations', require('./routes/donations'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器错误'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`前端地址: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
