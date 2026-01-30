const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    required: true,
    enum: ['游客', '救助组织', '领养人', '捐赠者'],
    default: '游客'
  },
  avatar: {
    type: String,
    default: ''
  },
  organization: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  establishedDate: {
    type: Date
  },
  walletAddress: {
    type: String,
    default: ''
  },
  profile: {
    name: String,
    avatar: String,
    bio: String,
    location: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 更新最后登录时间
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
