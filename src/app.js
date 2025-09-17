const express = require('express');
const connectDB = require('./config/database');

const app = express();

// Vercel için trust proxy ayarı
app.set('trust proxy', 1);

// --- MongoDB bağlantısını başlat ---
connectDB();   // ✅ uygulama ayağa kalkarken 1 kez bağlanır

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Route imports
const projectsRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

// ROUTE REGISTRATIONS
app.use('/api/projects', projectsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    res.json({ 
      ok: true, 
      db: mongoose.connection.name, 
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      timestamp: new Date().toISOString()
    });
  } catch (e) { 
    res.status(503).json({ 
      ok: false, 
      error: e.message,
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
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Lokal development için listen ekle
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
