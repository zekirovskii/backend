const express = require('express');
require('dotenv').config();

// MongoDB bağlantısını tekrar aktifleştir
const connectDB = require('./config/database');

// Route imports - EKLE
const projectsRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();

// Vercel için trust proxy ayarı
app.set('trust proxy', 1);

// MongoDB bağlantısını başlat
connectDB();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS request'leri için
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Body parsing
app.use(express.json());

// Static files for uploads - EKLE
app.use('/uploads', express.static('uploads'));

// ROUTE REGISTRATIONS - EKLE
app.use('/api/projects', projectsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint - GELİŞTİRİLMİŞ
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    
    let dbStatusText = 'Unknown';
    switch(dbStatus) {
      case 0: dbStatusText = 'Disconnected'; break;
      case 1: dbStatusText = 'Connected'; break;
      case 2: dbStatusText = 'Connecting'; break;
      case 3: dbStatusText = 'Disconnecting'; break;
    }

    res.json({
      status: 'OK',
      message: 'Backend API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      runtime: 'nodejs', // Runtime bilgisi eklendi
      database: {
        status: dbStatusText,
        readyState: dbStatus,
        host: mongoose.connection.host || 'Not connected',
        name: mongoose.connection.name || 'Not connected'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Diagnostic endpoint - EKLE
app.get('/api/diag', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    
    let dbStatusText = 'Unknown';
    switch(dbStatus) {
      case 0: dbStatusText = 'Disconnected'; break;
      case 1: dbStatusText = 'Connected'; break;
      case 2: dbStatusText = 'Connecting'; break;
      case 3: dbStatusText = 'Disconnecting'; break;
    }

    res.json({
      status: 'OK',
      message: 'Diagnostic endpoint',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      runtime: 'nodejs',
      database: {
        status: dbStatusText,
        readyState: dbStatus,
        host: mongoose.connection.host || 'Not connected',
        name: mongoose.connection.name || 'Not connected'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ipv4: 'Forced via family: 4'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Diagnostic failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📦 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
});

module.exports = app;
    