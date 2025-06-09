import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use absolute path for screenshots directory
const screenshotsDir = '/var/www/SFManagers/uploads/screenshots';

const router = express.Router();

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Simple endpoint to save screenshots
router.post('/save', (req, res) => {
  try {
    console.log('Screenshot save endpoint called');
    
    if (!req.files || !req.files.screenshot) {
      return res.status(400).json({ 
        message: 'No screenshot file uploaded'
      });
    }
    
    const { startupId, userName } = req.body;
    if (!startupId || !userName) {
      return res.status(400).json({
        message: 'startupId and userName are required'
      });
    }
    
    // Generate filename with format: startup-user_name-timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${startupId}-${userName}-${timestamp}.jpg`.replace(/[\s/]/g, '_');
    const filePath = path.join(screenshotsDir, fileName);
    
    // Move the uploaded file to the screenshots directory
    req.files.screenshot.mv(filePath, (err) => {
      if (err) {
        console.error('Error saving screenshot:', err);
        return res.status(500).json({ 
          message: 'Error saving screenshot', 
          error: err.message
        });
      }
      
      console.log(`Screenshot saved to ${filePath}`);
      res.status(200).json({ 
        message: 'Screenshot saved successfully',
        fileName: fileName
      });
    });
  } catch (error) {
    console.error('Error in screenshot save endpoint:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// Get all screenshots
router.get('/list', (req, res) => {
  try {
    if (!fs.existsSync(screenshotsDir)) {
      return res.status(200).json({ screenshots: [] });
    }
    
    const files = fs.readdirSync(screenshotsDir)
      .filter(file => file.endsWith('.jpg'))
      .map(file => ({
        name: file,
        path: `/uploads/screenshots/${file}`,
        timestamp: new Date(file.split('-').slice(-3).join('-').replace('.jpg', '').replace(/-/g, ':')).toISOString()
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.status(200).json({ screenshots: files });
  } catch (error) {
    console.error('Error listing screenshots:', error);
    res.status(500).json({ message: 'Error listing screenshots' });
  }
});

export default router;
