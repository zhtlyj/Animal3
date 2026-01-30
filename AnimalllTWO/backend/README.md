# 动物保护平台 - 后端API

基于Node.js + Express + MongoDB的后端服务，为前端提供RESTful API接口。

## 功能特性

- 🔐 JWT用户认证系统
- 🐕 动物信息管理
- 💰 捐赠项目管理
- 🔒 基于角色的权限控制
- 📊 数据统计和分析
- 🌐 RESTful API设计

## 技术栈

- **Node.js** - 运行时环境
- **Express** - Web框架
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

## 安装和运行

### 从项目根目录启动
```bash
# 在项目根目录
npm run start:backend
```

### 单独启动后端
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/animal_protection
DB_NAME=animal_protection

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# 服务器配置
PORT=5000
NODE_ENV=development

# CORS配置
FRONTEND_URL=http://localhost:3000
```

### 3. 启动MongoDB

确保MongoDB服务正在运行：

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:5000` 启动。

## API文档

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料

### 动物管理接口

- `GET /api/animals` - 获取动物列表
- `GET /api/animals/:id` - 获取动物详情
- `POST /api/animals` - 发布动物信息（需认证）
- `PUT /api/animals/:id` - 更新动物信息（需认证）
- `DELETE /api/animals/:id` - 删除动物信息（需认证）
- `POST /api/animals/:id/like` - 点赞/取消点赞（需认证）
- `POST /api/animals/:id/adopt` - 申请领养（需认证）

### 捐赠管理接口

- `GET /api/donations/projects` - 获取项目列表
- `GET /api/donations/projects/:id` - 获取项目详情
- `POST /api/donations/projects` - 创建项目（需认证）
- `POST /api/donations` - 进行捐赠（需认证）
- `GET /api/donations/history` - 获取捐赠历史（需认证）
- `GET /api/donations/stats` - 获取统计信息

## 数据库模型

### User（用户）
- 用户基本信息
- 身份类型（游客、救助组织、领养人、捐赠者）
- 钱包地址
- 个人资料

### Animal（动物）
- 动物基本信息
- 发布者信息
- 领养者信息
- 历史记录
- 点赞数据

### Donation（捐赠）
- 捐赠者信息
- 捐赠金额和方式
- 关联项目或动物
- 交易信息

### Project（项目）
- 项目基本信息
- 创建者信息
- 目标金额和当前金额
- 项目状态

## 权限控制

- **游客**: 浏览功能
- **救助组织**: 发布动物信息、创建捐赠项目
- **领养人**: 申请领养
- **捐赠者**: 进行捐赠

## 开发说明

- 使用Mongoose进行数据库操作
- JWT令牌用于身份认证
- bcryptjs加密用户密码
- 支持跨域请求（CORS）
- 统一的错误处理机制
