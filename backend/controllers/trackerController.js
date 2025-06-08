import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../../uploads/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Upload screenshot
export const uploadScreenshot = async (req, res) => {
  try {
    console.log('Screenshot upload request received');
    console.log('Request files:', req.files ? Object.keys(req.files) : 'none');
    console.log('Request body keys:', Object.keys(req.body));
    
    // Check if we have the screenshot file and metadata
    if (!req.files || !req.files.screenshot || !req.body.metadata) {
      console.log('Missing required data:', {
        hasFiles: !!req.files,
        hasScreenshot: req.files ? !!req.files.screenshot : false,
        hasMetadata: !!req.body.metadata
      });
      return res.status(400).json({ message: 'Screenshot file and metadata are required' });
    }
    
    // Parse metadata from the form data
    const metadata = JSON.parse(req.body.metadata);
    console.log('Parsed metadata:', metadata);
    const { userId, startupId, userName, timestamp } = metadata;
    
    if (!userId || !startupId) {
      console.log('Missing required metadata fields:', { userId, startupId });
      return res.status(400).json({ message: 'User ID and Startup ID are required in metadata' });
    }
    
    // Create uploads/screenshots directory if it doesn't exist
    if (!fs.existsSync(screenshotsDir)) {
      console.log('Creating screenshots directory:', screenshotsDir);
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // Generate filename with the required format: startup-user_name-timestamp
    const fileName = `${startupId}-${userName}-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`.replace(/[\s/]/g, '_');
    const filePath = path.join(screenshotsDir, fileName);
    console.log('Generated file path:', filePath);
    
    // Move the uploaded file to the screenshots directory
    console.log('Screenshot file size:', req.files.screenshot.size, 'bytes');
    await req.files.screenshot.mv(filePath);
    console.log('File moved to destination');
    
    // Save screenshot info to database
    console.log('Saving to database with values:', { userId, startupId, filePath, timestamp: timestamp || new Date() });
    await db.query(
      'INSERT INTO screenshots (user_id, startup_id, file_path, timestamp) VALUES (?, ?, ?, ?)',
      [userId, startupId, filePath, timestamp || new Date()]
    );
    console.log('Database record created');
    
    res.status(200).json({ 
      message: 'Screenshot uploaded successfully',
      filePath: filePath
    });
    console.log('Success response sent');
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get screenshots for a specific user and startup
export const getScreenshots = async (req, res) => {
  try {
    const { userId, startupId } = req.params;
    
    const result = await db.query(
      'SELECT * FROM screenshots WHERE user_id = ? AND startup_id = ? ORDER BY timestamp DESC',
      [userId, startupId]
    );
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting screenshots:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
