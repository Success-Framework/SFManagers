const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const { db } = require('../database');

// Check if Notification table exists, create it if it doesn't
const ensureNotificationTable = async () => {
  try {
    // Try to create the Notification table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS Notification (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        isRead BOOLEAN DEFAULT false,
        data TEXT,
        link VARCHAR(255),
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_notification_userId (userId)
      )
    `;
    
    await db.query(createTableSQL);
    console.log('Notification table created or verified');
    return true;
  } catch (error) {
    console.error('Error creating Notification table:', error);
    return false;
  }
};

// Ensure notification table exists when routes are loaded
ensureNotificationTable();

// Get all notifications for the current user
router.get('/user', auth, async (req, res) => {
  try {
    // Additional logging to debug auth
    console.log('Fetching notifications for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.error('User not properly authenticated');
      return res.status(401).json({ msg: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    
    // Check table exists before querying
    await ensureNotificationTable();
    
    // Try/catch specifically for the database query
    try {
      const notifications = await db.findMany('notifications', { 
        userId: userId 
      }, {
        orderBy: { createdAt: 'DESC' }
      });
      
      console.log(`Found ${notifications?.length || 0} notifications for user ${userId}`);
      res.json(notifications || []);
    } catch (dbError) {
      console.error('Database error fetching notifications:', dbError);
      // Check if error is due to table not existing
      if (dbError.message && dbError.message.includes("doesn't exist")) {
        return res.status(500).json({ msg: 'Notification table does not exist', error: dbError.message });
      }
      res.status(500).json({ msg: 'Database error', error: dbError.message });
    }
  } catch (error) {
    console.error('Unexpected error fetching notifications:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Mark a notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    // Check table exists before querying
    await ensureNotificationTable();
    
    // First verify the notification belongs to this user
    const notification = await db.findOne('notifications', { 
      id: notificationId,
      userId: userId
    });
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found or not authorized' });
    }
    
    // Update the notification
    await db.update('notifications', notificationId, { 
      isRead: true,
      updatedAt: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Mark all notifications as read for the current user
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check table exists before querying
    await ensureNotificationTable();
    
    // Update all user's notifications
    await db.query(
      'UPDATE Notification SET isRead = true, updatedAt = ? WHERE userId = ?',
      [new Date(), userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    // Check table exists before querying
    await ensureNotificationTable();
    
    // First verify the notification belongs to this user
    const notification = await db.findOne('notifications', { 
      id: notificationId,
      userId: userId
    });
    
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found or not authorized' });
    }
    
    // Delete the notification
    await db.delete('notifications', notificationId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Clear all notifications for the current user
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check table exists before querying
    await ensureNotificationTable();
    
    // Delete all user's notifications
    await db.query(
      'DELETE FROM Notification WHERE userId = ?',
      [userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

module.exports = router; 