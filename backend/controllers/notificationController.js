import { v4 as uuidv4 } from 'uuid';
import { db } from '../database.js';

export const checkNotificationsTable = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error creating notifications table:', error);
    throw error;
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log('Fetching notifications for user:', req.user?.id);

    if (!userId) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const notifications = await db.findMany('notifications', {
      userId: userId
    });

    console.log(`Found ${notifications?.length || 0} notifications for user ${userId}`);
    res.json(notifications || []);
  } catch (error) {
    console.error('Unexpected error fetching notifications:', error);
    if (error.message.includes('no such table')) {
      return res.status(500).json({ msg: 'notifications table does not exist', error: error.message });
    }
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
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
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    await db.query(
      'UPDATE notifications SET isRead = true, updatedAt = ? WHERE userId = ?',
      [new Date(), userId]
    );

    res.json({ success: true  });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
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
};

export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    await db.query(
      'DELETE FROM notifications WHERE userId = ?',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};