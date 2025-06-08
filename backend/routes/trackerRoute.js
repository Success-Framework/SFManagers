import express from 'express';
import { uploadScreenshot, getScreenshots } from '../controllers/trackerController.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, '../../uploads/screenshots');

const router = express.Router();

// Test endpoint to verify file upload functionality
router.post('/test-upload', (req, res) => {
  try {
    console.log('Test upload endpoint called');
    console.log('Request files:', req.files ? Object.keys(req.files) : 'none');
    console.log('Request body keys:', Object.keys(req.body));
    
    if (!req.files || !req.files.screenshot) {
      return res.status(400).json({ 
        message: 'No file uploaded',
        files: req.files ? Object.keys(req.files) : 'none',
        body: Object.keys(req.body)
      });
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const testFile = req.files.screenshot;
    const fileName = 'test-' + Date.now() + '.txt';
    const filePath = path.join(screenshotsDir, fileName);
    
    // Move the uploaded file
    testFile.mv(filePath, (err) => {
      if (err) {
        console.error('Error moving file:', err);
        return res.status(500).json({ 
          message: 'Error saving file', 
          error: err.message,
          stack: err.stack
        });
      }
      
      res.status(200).json({ 
        message: 'Test file uploaded successfully',
        filePath: filePath,
        fileSize: testFile.size
      });
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Screenshot routes
router.post('/upload', uploadScreenshot);
router.get('/screenshots/:userId/:startupId', getScreenshots);

export default router;
