const express = require('express');
require('dotenv').config();

// MongoDB bağlantısını tekrar aktifleştir
const connectDB = require('./config/database');

// Route imports
const projectsRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();

// Vercel için trust proxy ayarı
app.set('trust proxy', 1);

// CORS
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://portfolio-kappa-sepia-4apso6ftjs.vercel.app', // Frontend
    'https://backend-one-beige-70.vercel.app' // Backend
  ];
  const origin = req.headers.origin;
  
  // Origin kontrolü
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Postman gibi origin olmayan istekler
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 saat cache
  
  // OPTIONS request'leri için (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Body parsing
app.use(express.json());

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Database middleware
const withDB = (router) => [
  async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (e) {
      console.error('DB connection error:', e.message);
      res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed' 
      });
    }
  },
  router
];

// ROUTE REGISTRATIONS - Database middleware ile
app.use('/api/projects', ...withDB(projectsRoutes));
app.use('/api/admin', ...withDB(adminRoutes));
app.use('/api/upload', ...withDB(uploadRoutes));

// Health check endpoint - DB bağlantısı olmadan
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
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