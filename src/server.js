const express = require('express');
const cors = require('cors');
require('dotenv').config();

// MongoDB bağlantısını tekrar aktifleştir
const connectDB = require('./config/database');

// Route imports
const projectsRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const mailRoutes = require('./routes/mail'); // YENİ

const app = express();

// Vercel için trust proxy ayarı
app.set('trust proxy', 1);

// CORS - Tüm origin'lere izin ver
app.use(cors({
  origin: '*', // Tüm origin'lere izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false // Cookie kullanmıyorsan false
}));

// Body parsing - LIMIT ARTIRILDI
app.use(express.json({ limit: '50mb' })); // 50MB limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // URL encoded için de limit

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 saniye
  res.setTimeout(30000); // 30 saniye
  next();
});

// Database middleware - HIZLI BAĞLANTI
const withDB = (router) => [
  async (req, res, next) => {
    try {
      // Eğer zaten bağlıysa, hemen geç
      if (global.mongoose?.conn) {
        return next();
      }
      
      // Hızlı bağlantı - timeout kısa
      await Promise.race([
        connectDB(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DB connection timeout')), 5000)
        )
      ]);
      
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
app.use('/api/mail', mailRoutes); // YENİ - Database gerektirmez

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
const server = require('http').createServer(app);

// Timeout ayarları
server.timeout = 30000; // 30 saniye
server.keepAliveTimeout = 30000;
server.headersTimeout = 31000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📦 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
});

module.exports = app;