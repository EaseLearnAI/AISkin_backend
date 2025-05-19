const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '日常护肤方案'
  },
  requirement: {
    type: String,
    default: ''
  },
  morning: [{
    step: Number,
    product: String
  }],
  evening: [{
    step: Number,
    product: String
  }],
  recommendations: {
    type: Array,
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan; 