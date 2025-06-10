const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/screenshots');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with startup ID, timestamp and original extension
    const startupId = req.body.startupId || 'unknown';
    const userName = req.body.userName || 'unknown';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExt = path.extname(file.originalname) || '.jpg';
    
    const filename = `${startupId}_${userName}_${timestamp}${fileExt}`;
    cb(null, filename);
  }
});

// Create upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route POST /api/screenshots/save
 * @desc Upload a screenshot
 * @access Private
 */
router.post('/save', auth, upload.single('screenshot'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { startupId, userName } = req.body;
    
    if (!startupId) {
      return res.status(400).json({ message: 'Startup ID is required' });
    }
    
    // Return success with file info
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
      },
      startupId,
      userName,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/screenshots/:startupId
 * @desc Get all screenshots for a startup
 * @access Private
 */
router.get('/:startupId', auth, (req, res) => {
  try {
    const { startupId } = req.params;
    const uploadDir = path.join(__dirname, '../../uploads/screenshots');
    
    // Check if directory exists
    if (!fs.existsSync(uploadDir)) {
      return res.json([]);
    }
    
    // Read all files in directory
    const files = fs.readdirSync(uploadDir);
    
    // Filter files by startup ID
    const screenshots = files
      .filter(file => file.startsWith(`${startupId}_`))
      .map(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        const parts = file.split('_');
        
        return {
          filename: file,
          path: `/uploads/screenshots/${file}`,
          startupId: parts[0],
          userName: parts[1],
          timestamp: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(screenshots);
    
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
