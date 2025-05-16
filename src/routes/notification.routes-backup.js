const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const { db } = require('../database');

// Check if notifications table exists, create it if it doesn't
router.use(async (req, res, next) => {
  try {
    // Try to create the notifications table if it doesn't exist
    await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(191) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      title VARCHAR(191) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(191) NOT NULL DEFAULT 'INFO',
      isRead BOOLEAN NOT NULL DEFAULT FALSE,
      data TEXT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX notification_user_idx (userId),
      FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE
    )
    `);
    console.log('notifications table created or verified');
    next();
  } catch (error) {
    console.error('Error creating notifications table:', error);
    next(error);
  }
});

// Get all notifications for the current user
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log('Fetching notifications for user:', req.user?.id);

    if (!userId) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    try {
      const notifications = await db.findMany('notifications', {
        userId: userId
      });

      console.log(`Found ${notifications?.length || 0} notifications for user ${userId}`);
      res.json(notifications || []);
    } catch (dbError) {
      console.error('Database error fetching notifications:', dbError);
      if (dbError.message.includes('no such table')) {
        return res.status(500).json({ msg: 'notifications table does not exist', error: dbError.message });
      }
      throw dbError;
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
    const userId = req.user?.id;

    const notification = await db.findOne('notifications', {
      id: notificationId,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    await db.update('notifications', notificationId, {
      isRead: true,
      updatedAt: new Date()
    });

    res.json({ msg: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Mark all notifications as read for the current user
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    // Update all user's notifications
    await db.query(
      'UPDATE notifications SET isRead = true, updatedAt = ? WHERE userId = ?',
      [new Date(), userId]
    );

    res.json({ msg: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;

    const notification = await db.findOne('notifications', {
      id: notificationId,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    await db.delete('notifications', notificationId);

    res.json({ msg: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

// Clear all notifications for the current user
router.delete('/clear-all', auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    // Delete all user's notifications
    await db.query(
      'DELETE FROM notifications WHERE userId = ?',
      [userId]
    );

    res.json({ msg: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
});

module.exports = router; 