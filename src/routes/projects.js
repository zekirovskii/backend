const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');

// GET /api/projects - Get all published projects
router.get('/', async (req, res) => {
  try {
    const { featured, limit = 10, page = 1 } = req.query;
    
    const query = { status: 'published' };
    if (featured === 'true') {
      query.featured = true;
    }

    const projects = await Project.find(query)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Project.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProjects: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      status: 'published' 
    }).select('-__v');

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    res.json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project',
      error: error.message
    });
  }
});

// POST /api/projects - Create new project (Admin only)
router.post('/', auth, validateProject, async (req, res) => {
  try {
    // Debug logging
    console.log(' Creating project with data:', JSON.stringify(req.body, null, 2));
    
    // Status mapping - Frontend'den gelen status'u backend enum'ına çevir
    const statusMapping = {
      'Completed': 'published',
      'In Progress': 'draft',
      'Archived': 'archived',
      'Draft': 'draft',
      'Published': 'published'
    };
    
    // Frontend verisini backend schema'ya uygun hale getir
    const projectData = {
      title: req.body.title,
      description: req.body.description,
      technologies: req.body.technologies,
      githubUrl: req.body.githubUrl || undefined,
      liveUrl: req.body.liveUrl || undefined,
      featured: req.body.featured || false,
      status: statusMapping[req.body.status] || 'draft',
      images: req.body.image ? [req.body.image] : [], // images array
      image: req.body.image || undefined // image field da ekle
    };
    
    console.log(' Processed project data:', JSON.stringify(projectData, null, 2));
    
    const project = new Project(projectData);
    await project.save();

    console.log('✅ Project created successfully:', project._id);

    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    console.error('❌ Project creation failed:', error.message);
    console.error('❌ Validation errors:', error.errors);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create project',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.errors })
    });
  }
});

// PUT /api/projects/:id - Update project (Admin only)
router.put('/:id', auth, validateProject, async (req, res) => {
  try {
    // Debug logging
    console.log(' Updating project with data:', JSON.stringify(req.body, null, 2));
    
    // Status mapping - Frontend'den gelen status'u backend enum'ına çevir
    const statusMapping = {
      'Completed': 'published',
      'In Progress': 'draft',
      'Archived': 'archived',
      'Draft': 'draft',
      'Published': 'published'
    };
    
    // Frontend verisini backend schema'ya uygun hale getir
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      technologies: req.body.technologies,
      githubUrl: req.body.githubUrl || undefined,
      liveUrl: req.body.liveUrl || undefined,
      featured: req.body.featured || false,
      status: statusMapping[req.body.status] || req.body.status,
      image: req.body.image || undefined // Sadece image field
    };
    
    // Undefined değerleri temizle
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    console.log('🔄 Processed update data:', JSON.stringify(updateData, null, 2));
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    console.log('✅ Project updated successfully:', project._id);

    res.json({
      status: 'success',
      message: 'Project updated successfully',
      data: { project }
    });
  } catch (error) {
    console.error('❌ Project update failed:', error.message);
    console.error('❌ Validation errors:', error.errors);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update project',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { details: error.errors })
    });
  }
});

// DELETE /api/projects/:id - Delete project (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

module.exports = router;