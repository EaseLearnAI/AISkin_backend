const express = require('express');
const { 
  register, 
  login, 
  getMe,
  updateUsername,
  getUserStats,
  logout
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/update-username', protect, updateUsername);
router.get('/stats', protect, getUserStats);
router.post('/logout', protect, logout);

module.exports = router; 