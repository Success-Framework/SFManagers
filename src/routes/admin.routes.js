const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { runUrgencyUpdate } = require('../services/urgency-calculator');

// Admin route for manually running the urgency calculator
router.post('/update-task-urgency', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log('Admin triggered manual urgency update');
    const result = await runUrgencyUpdate();
    
    if (result.success) {
      res.json({ 
        message: 'Task urgency levels updated successfully', 
        updatedCount: result.updatedCount 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to update task urgency levels', 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error in admin update-task-urgency route:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router; 