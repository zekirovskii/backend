const express = require('express');
const cors = require('cors');
// const helmet = require('helmet'); // Geçici olarak devre dışı
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// MongoDB bağlantısını aktifleştir
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB bağlantısını başlat
connectDB();

// Vercel için trust proxy ayarı
app.set('trust proxy', 1);

// Security middleware - Geçici olarak devre dışı
// app.use(helmet());

// Rate limiting - Vercel için güncellenmiş
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Development için artırıldı
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Vercel için özel ayarlar
  trustProxy: true,
  skip: (req) => {
    // Health check endpoint'ini rate limit'ten hariç tut
    return req.path === '/api/health';
  }
});

app.use(limiter);

// CORS configuration - Frontend URL'ini güncelleyin
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    'https://portfolio-kappa-sepia-4apso6ftjs.vercel.app' // Frontend URL'i ekleyin
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
};

app.use(cors(corsOptions));

// Preflight requests için
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files için özel CORS middleware
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Tüm origin'lere izin ver
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS request için
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes - Admin ve Projects API'lerini aktifleştir
app.use('/api/projects', require('./routes/projects'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS enabled for all origins`);
  console.log(`📁 Static files served at: http://localhost:${PORT}/uploads/`);
});

module.exports = app;
    