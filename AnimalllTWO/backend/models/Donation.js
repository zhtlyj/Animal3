const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // 捐赠者信息
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 捐赠金额
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // 捐赠方式
  method: {
    type: String,
    required: true,
    enum: ['支付宝', '微信', '银行卡', '加密货币']
  },
  // 关联项目
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  // 关联动物
  animal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal'
  },
    // 交易信息
    transaction: {
      txHash: String,
      blockNumber: Number,
      gasUsed: Number,
      blockchainDonationId: String  // 链上捐赠ID
    },
  // 捐赠状态
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  // 备注
  note: {
    type: String,
    default: ''
  },
  // 是否匿名
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ project: 1 });
donationSchema.index({ animal: 1 });
donationSchema.index({ status: 1 });

module.exports = mongoose.model('Donation', donationSchema);
