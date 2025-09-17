const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const auth = require('../middleware/auth');

// Vercel için memory storage kullan
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Helper function to get full URL
const getFullUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// POST /api/upload/image - Upload single image
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file provided'
      });
    }

    // Vercel'de dosya yazma yapamayız, sadece base64 döndürüyoruz
    const base64 = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
    
    res.json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        filename: `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
        originalName: req.file.originalname,
        size: req.file.size,
        url: dataUrl, // Base64 data URL
        base64: base64
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// POST /api/upload/images - Upload multiple images
router.post('/images', auth, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No image files provided'
      });
    }

    const uploadedImages = req.files.map(file => {
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;
      
      return {
        filename: `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
        originalName: file.originalname,
        size: file.size,
        url: dataUrl, // Base64 data URL
        base64: base64
      };
    });
    
    res.json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages,
        count: uploadedImages.length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 5MB.'
      });
    }
  }
  
  res.status(400).json({
    status: 'error',
    message: error.message
  });
});

module.exports = router;