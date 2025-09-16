const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');
const { validateAdmin } = require('../middleware/validation');

// POST /api/admin/register - Register new admin
router.post('/register', validateAdmin, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin with this username or email already exists'
      });
    }

    const admin = new Admin({ username, password, email });
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to register admin',
      error: error.message
    });
  }
});

// POST /api/admin/login - Login admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    });

    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to login',
      error: error.message
    });
  }
});

// POST /api/admin/logout - Logout admin
router.post('/logout', auth, async (req, res) => {
  try {
    // JWT token'ı blacklist'e ekleyebiliriz (opsiyonel)
    // Şimdilik sadece success response döndürüyoruz
    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to logout',
      error: error.message
    });
  }
});

// GET /api/admin/profile - Get admin profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: { admin: req.admin }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// PUT /api/admin/profile - Update admin profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { admin }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

module.exports = router;