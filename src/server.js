const express = require('express');
const cors = require('cors');
require('dotenv').config();

// MongoDB bağlantısını tekrar aktifleştir
const connectDB = require('./config/database');

// Route imports
const projectsRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const mailRoutes = require('./routes/mail');

const app = express();

// CORS - Daha güçlü ayarlar
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: false,
  optionsSuccessStatus: 200
}));

// OPTIONS request'leri için özel handler
app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Database middleware
const withDB = (router) => [
  async (req, res, next) => {
    try {
      if (global.mongoose?.conn) {
        return next();
      }
      
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

// ROUTE REGISTRATIONS
app.use('/api/projects', ...withDB(projectsRoutes));
app.use('/api/admin', ...withDB(adminRoutes));
app.use('/api/upload', ...withDB(uploadRoutes));
app.use('/api/mail', mailRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
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
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
});

module.exports = app;