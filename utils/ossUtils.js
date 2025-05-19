const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// OSS客户端配置
// OSS 客户端配置
const client = new OSS({
  region: process.env.OSS_REGION, // 华北 2（北京）
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
  authorizationV4: process.env.OSS_AUTHORIZATION_V4 === 'true', // 将字符串转换为布尔值
});

// 自定义请求头
const headers = {
  'x-oss-storage-class': 'Standard',
  'x-oss-object-acl': 'public-read', // 设置为公开读取，便于前端访问
};

/**
 * 上传文件到OSS
 * @param {Buffer|Stream|String} file - 文件内容或路径
 * @param {String} filename - 存储到OSS的文件名
 * @returns {Promise<Object>} - 上传结果，包含url
 */
const uploadToOSS = async (file, filename) => {
  try {
    // 生成唯一文件名，避免冲突
    const uniqueFilename = `${Date.now()}-${filename}`;
    
    let fileBuffer;
    
    // 处理不同类型的文件输入
    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else if (typeof file === 'string') {
      // 如果是文件路径，读取文件
      fileBuffer = fs.readFileSync(file);
    } else {
      // 假设是流，转换为Buffer
      fileBuffer = await streamToBuffer(file);
    }
    
    // 上传到OSS
    const result = await client.put(uniqueFilename, fileBuffer, { headers });
    
    console.log('OSS上传成功:', result.url);
    
    return {
      success: true,
      url: result.url,
      name: uniqueFilename,
      result
    };
  } catch (error) {
    console.error('OSS上传失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 从OSS下载文件
 * @param {String} ossFilename - OSS上的文件名
 * @param {String} localPath - 下载到本地的路径，可选
 * @returns {Promise<Object>} - 下载结果
 */
const downloadFromOSS = async (ossFilename, localPath = null) => {
  try {
    const result = await client.get(ossFilename, localPath);
    
    console.log('OSS下载成功:', result.res.status);
    
    return {
      success: true,
      data: result.content, // 如果没有指定localPath，返回文件内容
      result
    };
  } catch (error) {
    console.error('OSS下载失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 获取OSS文件的URL
 * @param {String} ossFilename - OSS上的文件名
 * @returns {String} - 文件URL
 */
const getOSSFileUrl = (ossFilename) => {
  return `https://${client.options.bucket}.${client.options.endpoint.replace('https://', '')}/${ossFilename}`;
};

/**
 * 将流转换为Buffer
 * @param {Stream} stream - 输入流
 * @returns {Promise<Buffer>} - Buffer数据
 */
const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

module.exports = {
  client,
  uploadToOSS,
  downloadFromOSS,
  getOSSFileUrl
}; 