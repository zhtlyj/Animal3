# 数据存储迁移指南：从localStorage到MongoDB

## 🎯 迁移概述

本次迁移将动物保护平台的数据存储从浏览器localStorage迁移到MongoDB数据库，实现真正的后端数据持久化。

## 📊 迁移前后对比

### 迁移前（localStorage）
- ❌ 数据仅存储在用户浏览器中
- ❌ 无法跨设备同步
- ❌ 数据容易丢失
- ❌ 无法支持多用户协作
- ❌ 不适合生产环境

### 迁移后（MongoDB）
- ✅ 数据存储在服务器端
- ✅ 支持跨设备同步
- ✅ 数据持久化存储
- ✅ 支持多用户协作
- ✅ 适合生产环境部署

## 🏗️ 新架构设计

### 后端架构
```
backend/
├── config/
│   └── database.js          # 数据库连接配置
├── middleware/
│   └── auth.js              # 认证中间件
├── models/
│   ├── User.js              # 用户模型
│   ├── Animal.js            # 动物模型
│   ├── Donation.js          # 捐赠模型
│   └── Project.js           # 项目模型
├── routes/
│   ├── auth.js              # 认证路由
│   ├── animals.js           # 动物管理路由
│   └── donations.js         # 捐赠管理路由
├── server.js                # 服务器入口
└── package.json             # 后端依赖
```

### 前端架构
```
src/
├── services/
│   └── api.js               # API服务层
├── contexts/
│   ├── AuthContext.js       # 认证状态管理
│   ├── AnimalsContext.js    # 动物数据管理
│   └── DonationContext.js   # 捐赠数据管理
└── config/
    └── api.js               # API配置
```

## 🔄 数据模型映射

### 用户数据
```javascript
// localStorage (旧)
{
  id: "1234567890",
  userId: "user001",
  phone: "13800138000",
  email: "user@example.com",
  userType: "救助组织",
  createdAt: "2024-01-01T00:00:00.000Z"
}

// MongoDB (新)
{
  _id: ObjectId("..."),
  userId: "user001",
  phone: "13800138000",
  email: "user@example.com",
  password: "hashed_password",
  userType: "救助组织",
  walletAddress: "",
  profile: { name: "", avatar: "", bio: "" },
  isActive: true,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 动物数据
```javascript
// localStorage (旧)
{
  id: "a1",
  name: "小橘",
  species: "猫",
  status: "可领养",
  city: "上海",
  // ... 其他字段
}

// MongoDB (新)
{
  _id: ObjectId("..."),
  name: "小橘",
  species: "猫",
  status: "可领养",
  city: "上海",
  publisher: ObjectId("user_id"),
  adopter: ObjectId("user_id"),
  likes: [ObjectId("user_id")],
  history: [...],
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 部署步骤

### 1. 环境准备

#### 安装MongoDB
```bash
# Windows (使用Chocolatey)
choco install mongodb

# macOS (使用Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
```

#### 启动MongoDB服务
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 2. 后端部署

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
# 创建 .env 文件并配置数据库连接

# 启动后端服务
npm run dev
```

### 3. 前端部署

```bash
# 在项目根目录
npm install

# 启动前端服务
npm start
```

### 4. 验证部署

1. 访问 `http://localhost:3000` 查看前端
2. 访问 `http://localhost:5000/api/health` 检查后端API
3. 测试用户注册、登录功能
4. 测试动物信息发布功能
5. 测试捐赠功能

## 🔧 配置说明

### 后端环境变量 (.env)
```env
MONGODB_URI=mongodb://localhost:27017/animal_protection
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 前端环境变量
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## 📝 API接口变更

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料

### 动物管理接口
- `GET /api/animals` - 获取动物列表（支持分页和筛选）
- `GET /api/animals/:id` - 获取动物详情
- `POST /api/animals` - 发布动物信息
- `PUT /api/animals/:id` - 更新动物信息
- `DELETE /api/animals/:id` - 删除动物信息
- `POST /api/animals/:id/like` - 点赞/取消点赞
- `POST /api/animals/:id/adopt` - 申请领养

### 捐赠管理接口
- `GET /api/donations/projects` - 获取项目列表
- `GET /api/donations/projects/:id` - 获取项目详情
- `POST /api/donations/projects` - 创建项目
- `POST /api/donations` - 进行捐赠
- `GET /api/donations/history` - 获取捐赠历史
- `GET /api/donations/stats` - 获取统计信息

## 🔒 安全增强

1. **密码加密**: 使用bcryptjs加密存储
2. **JWT认证**: 基于令牌的身份验证
3. **权限控制**: 基于角色的访问控制
4. **输入验证**: 使用express-validator验证输入
5. **CORS配置**: 限制跨域请求来源

## 📈 性能优化

1. **数据库索引**: 为常用查询字段创建索引
2. **分页查询**: 支持大数据量的分页加载
3. **数据缓存**: 可考虑添加Redis缓存
4. **API限流**: 防止恶意请求

## 🐛 故障排除

### 常见问题

1. **MongoDB连接失败**
   - 检查MongoDB服务是否启动
   - 验证连接字符串是否正确

2. **JWT令牌无效**
   - 检查JWT_SECRET配置
   - 确认令牌未过期

3. **CORS错误**
   - 检查FRONTEND_URL配置
   - 确认前端地址正确

4. **API请求失败**
   - 检查后端服务是否启动
   - 验证API地址配置

## 📚 后续开发建议

1. **数据迁移工具**: 开发从localStorage到MongoDB的数据迁移脚本
2. **API文档**: 使用Swagger生成API文档
3. **单元测试**: 添加后端API的单元测试
4. **日志系统**: 添加请求日志和错误日志
5. **监控告警**: 添加系统监控和告警机制

## 🎉 迁移完成

恭喜！你已经成功将动物保护平台从localStorage迁移到MongoDB。现在你的应用具备了：

- ✅ 真正的数据持久化
- ✅ 多用户支持
- ✅ 跨设备同步
- ✅ 生产环境就绪
- ✅ 可扩展的架构

开始享受更强大的后端数据管理能力吧！
