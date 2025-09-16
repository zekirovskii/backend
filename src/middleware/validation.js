const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  // Debug logging
  console.log(' Validation check for:', req.method, req.path);
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  console.log('✅ Validation passed');
  next();
};

// Project validation rules - sadece gönderilen alanları kontrol et
const validateProject = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('technologies')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one technology must be specified'),
  body('githubUrl')
    .optional()
    .custom((value) => {
      // Boş string veya null ise geçerli kabul et
      if (!value || value.trim() === '') {
        return true;
      }
      // URL formatını kontrol et
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        throw new Error('GitHub URL must be a valid URL');
      }
      return true;
    }),
  body('liveUrl')
    .optional()
    .custom((value) => {
      // Boş string veya null ise geçerli kabul et
      if (!value || value.trim() === '') {
        return true;
      }
      // URL formatını kontrol et
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(value)) {
        throw new Error('Live URL must be a valid URL');
      }
      return true;
    }),
  handleValidationErrors
];

// Admin validation rules
const validateAdmin = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateProject,
  validateAdmin
};
