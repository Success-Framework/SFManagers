// Affiliate routes for tracking referral links
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Models
let affiliateClicks = [];

// Data file path
const dataDir = path.join(__dirname, '../../data');
const clicksDataFile = path.join(dataDir, 'affiliateClicks.json');

// Load data
try {
  if (fs.existsSync(clicksDataFile)) {
    const rawData = fs.readFileSync(clicksDataFile, 'utf8');
    if (rawData.trim()) {
      affiliateClicks = JSON.parse(rawData);
    }
  } else {
    // Create empty file if it doesn't exist
    fs.writeFileSync(clicksDataFile, JSON.stringify([]));
  }
} catch (err) {
  console.error('Error loading affiliate clicks data:', err);
}

// Save data
const saveData = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(clicksDataFile, JSON.stringify(affiliateClicks, null, 2));
  } catch (err) {
    console.error('Error saving affiliate clicks data:', err);
  }
};

// Track affiliate link click
router.post('/track', async (req, res) => {
  try {
    const { startupId, referrerId } = req.body;
    
    if (!startupId || !referrerId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Create new click record
    const newClick = {
      id: uuidv4(),
      startupId,
      referrerId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };
    
    // Add to clicks array
    affiliateClicks.push(newClick);
    
    // Save data
    saveData();
    
    // Return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stats for a user's affiliate link for a specific startup
router.get('/stats/:startupId/:userId', authMiddleware, async (req, res) => {
  try {
    const { startupId, userId } = req.params;
    
    // Only allow users to view their own stats
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Filter clicks for this startup and user
    const userClicks = affiliateClicks.filter(
      click => click.startupId === startupId && click.referrerId === userId
    );
    
    // Return click count
    res.json({
      clickCount: userClicks.length,
      startupId,
      userId
    });
  } catch (error) {
    console.error('Error getting affiliate stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
