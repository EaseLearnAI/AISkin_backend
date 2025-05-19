const axios = require('axios');
const Plan = require('../models/planModel');
const Product = require('../models/productModel');
require('dotenv').config();

// 从环境变量中获取 API 密钥
const API_KEY = process.env.API_KEY;
// 生成个性化护肤方案
const generatePlan = async (req, res) => {
  try {
    const { requirement } = req.body;
    
    console.log(`开始生成护肤方案，需求: ${requirement || '未指定'}`);

    // 获取用户的所有产品
    const products = await Product.find({ createdBy: req.user._id });
    
    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未找到任何产品，无法生成护肤方案'
      });
    }

    // 准备产品信息
    const productList = products.map(p => ({
      name: p.name,
      description: p.description || '',
      ingredients: p.ingredients || [],
      label: p.label || ''
    }));

    // 准备提示词
    const prompt = `
作为专业的护肤顾问，请为用户设计一套根据其具体需求和现有产品定制的早晚护肤方案。

用户需求：${requirement || '日常基础护肤，保湿补水'}

用户拥有的产品：
${productList.map((p, i) => `${i+1}. ${p.name} - ${p.label || '无标签'}`).join('\n')}

请用JSON格式输出一套完整的护肤方案，包括以下字段：
{
  "name": "方案名称（根据用户需求命名）",
  "morning": [
    {"step": 1, "product": "产品名称1"},
    {"step": 2, "product": "产品名称2"},
    {"step": 3, "product": "产品名称3"}
  ],
  "evening": [
    {"step": 1, "product": "产品名称1"},
    {"step": 2, "product": "产品名称4"},
    {"step": 3, "product": "产品名称5"}
  ],
  "recommendations": [
    "护肤建议1",
    "护肤建议2"
  ]
}

只选择用户已有的产品，按照正确的护肤顺序排列，确保兼容性和科学性。输出必须是有效的JSON格式，不要添加任何多余的说明文字。`;

    console.log('发送方案生成请求到AI模型');

    // 调用通义千问API
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: 'qwen-turbo-latest',
        messages: [
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    console.log('AI模型返回方案结果');

    let planResult;
    try {
      // 提取JSON内容
      const content = response.data.choices[0].message.content;
      console.log(`AI返回原始结果: ${content}`);
      
      // 尝试解析JSON
      planResult = JSON.parse(content);
    } catch (error) {
      console.error('解析AI返回结果失败:', error);
      return res.status(500).json({
        success: false,
        message: 'AI返回结果解析失败',
        error: error.message
      });
    }

    // 保存方案到数据库
    const plan = await Plan.create({
      name: planResult.name,
      requirement: requirement || '',
      morning: planResult.morning || [],
      evening: planResult.evening || [],
      recommendations: planResult.recommendations || [],
      createdBy: req.user._id
    });

    console.log(`护肤方案生成成功，ID: ${plan._id}`);

    return res.status(201).json({
      success: true,
      message: '护肤方案生成成功',
      data: {
        plan
      }
    });
  } catch (error) {
    console.error('生成护肤方案失败:', error);
    return res.status(500).json({
      success: false,
      message: '生成护肤方案失败',
      error: error.message
    });
  }
};

// 获取用户的所有护肤方案
const getUserPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: {
        plans
      }
    });
  } catch (error) {
    console.error('获取护肤方案失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取护肤方案失败',
      error: error.message
    });
  }
};

// 获取单个护肤方案
const getPlan = async (req, res) => {
  try {
    const plan = await Plan.findOne({ 
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '未找到护肤方案'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        plan
      }
    });
  } catch (error) {
    console.error('获取护肤方案失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取护肤方案失败',
      error: error.message
    });
  }
};

// 删除护肤方案
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findOneAndDelete({ 
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '未找到护肤方案'
      });
    }

    return res.status(200).json({
      success: true,
      message: '护肤方案删除成功',
      data: {}
    });
  } catch (error) {
    console.error('删除护肤方案失败:', error);
    return res.status(500).json({
      success: false,
      message: '删除护肤方案失败',
      error: error.message
    });
  }
};

module.exports = {
  generatePlan,
  getUserPlans,
  getPlan,
  deletePlan
}; 