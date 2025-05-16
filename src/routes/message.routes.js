const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.js');
const { db } = require('../database');

/**
 * Debug router to test if routes are registered properly
 */
router.get('/test', (req, res) => {
  return res.json({ message: 'Message routes are working!' });
});

/**
 * @route   POST /api/messages
 * @desc    Send a new message to a user
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Message send attempt:', req.body);
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    // Check if receiver exists
    const receiver = await db.findOne('User', { id: receiverId });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    
    // Create the message
    const message = await db.create('Message', {
      senderId: req.user.id,
      receiverId,
      content,
      read: false
    });
    
    console.log('Message created:', message);
    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * @route   GET /api/messages/inbox
 * @desc    Get all messages received by the user
 * @access  Private
 */
router.get('/inbox', authMiddleware, async (req, res) => {
  try {
    console.log('Getting inbox for user:', req.user.id);
    
    // Check if Message table exists
    try {
      // Simple query to check if table exists
      const checkTable = await db.raw('SHOW TABLES LIKE "Message"');
      console.log('Message table check:', checkTable);
      
      if (!checkTable || checkTable.length === 0) {
        console.error('Message table does not exist');
        return res.status(500).json({ error: 'Message system not initialized' });
      }
    } catch (tableError) {
      console.error('Error checking Message table:', tableError);
    }
    
    // Get messages with sender information
    const messages = await db.raw(`
      SELECT m.*, u.name as senderName, u.profileImage as senderProfileImage 
      FROM Message m
      JOIN User u ON m.senderId = u.id
      WHERE m.receiverId = ?
      ORDER BY m.createdAt DESC
    `, [req.user.id]);
    
    console.log('Inbox messages found:', messages ? messages.length : 0);
    return res.json(messages || []);
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    return res.status(500).json({ error: 'Failed to fetch inbox messages', details: error.message });
  }
});

/**
 * @route   GET /api/messages/sent
 * @desc    Get all messages sent by the user
 * @access  Private
 */
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    // Get messages with receiver information
    const messages = await db.raw(`
      SELECT m.*, u.name as receiverName, u.profileImage as receiverProfileImage 
      FROM Message m
      JOIN User u ON m.receiverId = u.id
      WHERE m.senderId = ?
      ORDER BY m.createdAt DESC
    `, [req.user.id]);
    
    return res.json(messages);
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    return res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

/**
 * @route   GET /api/messages/conversation/:userId
 * @desc    Get conversation between current user and specified user
 * @access  Private
 */
router.get('/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if the other user exists
    const otherUser = await db.findOne('User', { id: userId });
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get messages between users
    const messages = await db.raw(`
      SELECT m.*, 
             CASE WHEN m.senderId = ? THEN 'sent' ELSE 'received' END as direction
      FROM Message m
      WHERE (m.senderId = ? AND m.receiverId = ?)
         OR (m.senderId = ? AND m.receiverId = ?)
      ORDER BY m.createdAt ASC
    `, [req.user.id, req.user.id, userId, userId, req.user.id]);
    
    return res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * @route   PUT /api/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 */
router.put('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Check if message exists and belongs to user
    const message = await db.findOne('Message', { id: messageId });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.receiverId !== req.user.id) {
      return res.status(403).json({ error: 'You can only mark your own received messages as read' });
    }
    
    // Update message
    const updatedMessage = await db.update('Message', 
      { id: messageId },
      { read: true }
    );
    
    return res.json(updatedMessage);
  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Check if message exists and belongs to user
    const message = await db.findOne('Message', { id: messageId });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.senderId !== req.user.id && message.receiverId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete messages you sent or received' });
    }
    
    // Delete message
    await db.delete('Message', { id: messageId });
    
    return res.json({ msg: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get count of unread messages
 * @access  Private
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    console.log('Getting unread count for user:', req.user.id);
    
    // Check if Message table exists
    try {
      // Simple query to check if table exists
      const checkTable = await db.raw('SHOW TABLES LIKE "Message"');
      console.log('Message table check:', checkTable);
      
      if (!checkTable || checkTable.length === 0) {
        console.error('Message table does not exist');
        return res.json({ unreadCount: 0 });
      }
    } catch (tableError) {
      console.error('Error checking Message table:', tableError);
      return res.json({ unreadCount: 0 });
    }
    
    const result = await db.raw(`
      SELECT COUNT(*) as unreadCount
      FROM Message
      WHERE receiverId = ? AND \`read\` = 0
    `, [req.user.id]);
    
    console.log('Unread count result:', result);
    
    // Handle different result formats
    let unreadCount = 0;
    if (Array.isArray(result) && result.length > 0) {
      if (result[0][0]) {
        // MySQL2 format: [[{ unreadCount: 5 }]]
        unreadCount = result[0][0].unreadCount || 0;
      } else {
        // Alternate format: [{ unreadCount: 5 }]
        unreadCount = result[0].unreadCount || 0;
      }
    } else if (result && typeof result === 'object') {
      // Direct object format: { unreadCount: 5 }
      unreadCount = result.unreadCount || 0;
    }
    
    console.log('Processed unread count:', unreadCount);
    return res.json({ unreadCount });
  } catch (error) {
    console.error('Error counting unread messages:', error);
    return res.json({ unreadCount: 0 });
  }
});

module.exports = router; 