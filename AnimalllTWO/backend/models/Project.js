const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  goal: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // 项目创建者
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 项目状态
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  // 项目类型
  type: {
    type: String,
    enum: ['救助', '医疗', '设施', '教育', '其他'],
    default: '救助'
  },
  // 项目图片
  images: [{
    type: String
  }],
  // 项目标签
  tags: [{
    type: String
  }],
  // 截止时间
  deadline: {
    type: Date
  },
  // 项目进度
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // 是否公开
  isPublic: {
    type: Boolean,
    default: true
  },
  // 区块链相关
  blockchain: {
    projectId: String,  // 链上项目ID
    contractAddress: String,
    txHash: String
  }
}, {
  timestamps: true
});

// 计算进度
projectSchema.methods.calculateProgress = function() {
  this.progress = Math.round((this.currentAmount / this.goal) * 100);
  return this.progress;
};

// 索引
projectSchema.index({ creator: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ type: 1 });
projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
