const User = require('../models/userModel');
const Idea = require('../models/ideaModel');
const { generateToken } = require('../utils/jwtUtils');
const mongoose = require('mongoose');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Validate required fields
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供姓名、手机号和密码'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已被注册'
      });
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      password
    });

    // Generate token
    const token = generateToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '注册失败',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供手机号和密码'
      });
    }

    // Find user
    const user = await User.findOne({ phone }).select('+password');

    // Check if user exists and password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: '手机号或密码错误'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// Update username
exports.updateUsername = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate name
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '请提供新的用户名'
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '用户名更新成功',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '更新用户名失败',
      error: error.message
    });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    // 获取用户创建的反馈总数
    const ideasCount = await Idea.countDocuments({ createdBy: req.user._id });
    
    // 根据反馈类别统计数量
    const ideaCategories = await Idea.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(req.user._id) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // 获取用户账户创建时间
    const user = await User.findById(req.user._id);
    const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)); // 天数
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          ideasCount,
          ideaCategories,
          accountAge
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '获取用户统计数据失败',
      error: error.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // JWT实际上是无状态的，所以服务器端无法使其失效
    // 一般做法是客户端删除token，但我们在这里可以提供一个明确的logout API
    // 将来可以扩展为使用token黑名单或Redis存储等方式使token失效
    
    res.status(200).json({
      success: true,
      message: '登出成功',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
}; 