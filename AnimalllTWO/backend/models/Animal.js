const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  species: {
    type: String,
    required: true,
    enum: ['猫', '狗', '兔', '鸟', '爬宠', '其他']
  },
  status: {
    type: String,
    required: true,
    enum: ['可领养', '救助中', '已领养', '紧急求助'],
    default: '救助中'
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: String,
    default: ''
  },
  cover: {
    type: String,
    default: ''
  },
  media: [{
    type: String
  }],
  description: {
    type: String,
    required: true
  },
  healthReport: {
    type: String,
    default: ''
  },
  adoptionRequirements: {
    type: String,
    default: '需年满18岁，有稳定住所与经济来源，接受回访。'
  },
  // 区块链相关
  nft: {
    tokenId: String,
    contractAddress: String,
    metadataURI: String,
    txHash: String
  },
  // 发布者信息
  publisher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 领养者信息
  adopter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // 历史记录
  history: [{
    type: {
      type: String,
      enum: ['发布', '领养申请', '领养成功', '状态更新', '救助申请', '救助成功']
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    at: {
      type: Date,
      default: Date.now
    },
    tx: String,
    matchedOrgId: String,
    details: String
  }],
  // 点赞数据
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 收藏数据
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // 生活照（领养后的照片）
  lifePhotos: [{
    url: { type: String, required: true },
    description: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // 领养申请数据
  adoptionApplications: [{
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicantName: { type: String, required: true },
    applicantPhone: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    applicationDate: { type: Date, default: Date.now },
    // 区块链相关信息
    blockchain: {
      applicationId: String,  // 链上申请ID
      txHash: String,         // 交易哈希
      contractAddress: String // 合约地址
    }
  }],
  // 救助申请数据
  rescueApplications: [{
    rescuer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rescuerName: { type: String, required: true },
    rescuerPhone: { type: String, required: true },
    rescuerEmail: { type: String, required: true },
    organization: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    applicationDate: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 索引
animalSchema.index({ species: 1, status: 1 });
animalSchema.index({ city: 1 });
animalSchema.index({ publisher: 1 });
animalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Animal', animalSchema);
