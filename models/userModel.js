const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 手机号验证函数
const isValidPhone = (phone) => {
  // 中国手机号验证：11位数字，以1开头
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, '手机号是必需的'],
    unique: true,
    validate: {
      validator: isValidPhone,
      message: '请提供有效的手机号'
    }
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: 6,
    select: false // Don't include password in query results by default
  },
  name: {
    type: String,
    required: [true, '姓名是必需的']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only run if password is modified
  if (!this.isModified('password')) return next();
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  next();
});

// Method to compare password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 