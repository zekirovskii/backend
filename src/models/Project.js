const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  technologies: [{
    type: String,
    required: true,
    trim: true
  }],
  images: [{
    type: String, // URL to image
    required: false
  }],
  githubUrl: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'GitHub URL must be a valid URL'
    }
  },
  liveUrl: {
    type: String,
    required: false,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Live URL must be a valid URL'
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'Completed', 'In Progress', 'Published', 'Draft', 'Archived'],
    default: 'draft'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ status: 1, order: 1 });
projectSchema.index({ featured: 1 });

module.exports = mongoose.model('Project', projectSchema);