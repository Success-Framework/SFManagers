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

/**
 * GROUP CHAT ENDPOINTS
 */

/**
 * @route   GET /api/messages/groups
 * @desc    Get all group chats the user is part of
 * @access  Private
 */
router.get('/groups', authMiddleware, async (req, res) => {
  try {
    console.log('Getting group chats for user:', req.user.id);
    
    // Check if GroupChat table exists
    try {
      const checkTable = await db.raw('SHOW TABLES LIKE "GroupChat"');
      
      if (!checkTable || checkTable.length === 0) {
        console.log('GroupChat table does not exist, creating it...');
        
        // Create the GroupChat table if it doesn't exist
        await db.raw(`
          CREATE TABLE IF NOT EXISTS GroupChat (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            createdBy VARCHAR(36) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            isProject BOOLEAN DEFAULT FALSE,
            projectId VARCHAR(36),
            FOREIGN KEY (createdBy) REFERENCES User(id) ON DELETE CASCADE
          )
        `);
        
        // Create the GroupChatMember table to track membership
        await db.raw(`
          CREATE TABLE IF NOT EXISTS GroupChatMember (
            id VARCHAR(36) PRIMARY KEY,
            groupId VARCHAR(36) NOT NULL,
            userId VARCHAR(36) NOT NULL,
            joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            isAdmin BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (groupId) REFERENCES GroupChat(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
            UNIQUE KEY group_user_unique (groupId, userId)
          )
        `);
        
        // Create the GroupMessage table
        await db.raw(`
          CREATE TABLE IF NOT EXISTS GroupMessage (
            id VARCHAR(36) PRIMARY KEY,
            groupId VARCHAR(36) NOT NULL,
            senderId VARCHAR(36) NOT NULL,
            content TEXT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (groupId) REFERENCES GroupChat(id) ON DELETE CASCADE,
            FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE
          )
        `);
        
        // Create the GroupMessageRead table to track read status
        await db.raw(`
          CREATE TABLE IF NOT EXISTS GroupMessageRead (
            id VARCHAR(36) PRIMARY KEY,
            messageId VARCHAR(36) NOT NULL,
            userId VARCHAR(36) NOT NULL,
            readAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (messageId) REFERENCES GroupMessage(id) ON DELETE CASCADE,
            FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
            UNIQUE KEY message_user_unique (messageId, userId)
          )
        `);
        
        // Create default "General Discussion" group
        const generalGroupId = require('crypto').randomUUID();
        await db.create('GroupChat', {
          id: generalGroupId,
          name: 'General Discussion',
          description: 'Chat about anything related to SFManagers',
          createdBy: req.user.id,
          isProject: false
        });
        
        // Add the current user as a member and admin
        await db.create('GroupChatMember', {
          id: require('crypto').randomUUID(),
          groupId: generalGroupId,
          userId: req.user.id,
          isAdmin: true
        });
        
        // Create a welcome message
        await db.create('GroupMessage', {
          id: require('crypto').randomUUID(),
          groupId: generalGroupId,
          senderId: req.user.id,
          content: 'Welcome to the General Discussion group chat!'
        });
        
        // Create "Support" group
        const supportGroupId = require('crypto').randomUUID();
        await db.create('GroupChat', {
          id: supportGroupId,
          name: 'Support',
          description: 'Get help with the platform',
          createdBy: req.user.id,
          isProject: false
        });
        
        // Add the current user as a member
        await db.create('GroupChatMember', {
          id: require('crypto').randomUUID(),
          groupId: supportGroupId,
          userId: req.user.id,
          isAdmin: true
        });
      }
    } catch (tableError) {
      console.error('Error with GroupChat tables:', tableError);
      return res.status(500).json({ error: 'Group chat system not initialized properly' });
    }
    
    // Get all group chats the user is part of
    const groups = await db.raw(`
      SELECT gc.*, 
             gcm.isAdmin,
             (SELECT COUNT(*) FROM GroupChatMember WHERE groupId = gc.id) as memberCount,
             (SELECT COUNT(*) FROM GroupMessage WHERE groupId = gc.id) as messageCount,
             (SELECT MAX(gm.createdAt) FROM GroupMessage gm WHERE gm.groupId = gc.id) as lastActivity,
             (SELECT COUNT(*) FROM GroupMessage gm 
              LEFT JOIN GroupMessageRead gmr ON gm.id = gmr.messageId AND gmr.userId = ?
              WHERE gm.groupId = gc.id AND gmr.id IS NULL AND gm.senderId != ?) as unreadCount
      FROM GroupChat gc
      JOIN GroupChatMember gcm ON gc.id = gcm.groupId
      WHERE gcm.userId = ?
      ORDER BY lastActivity DESC
    `, [req.user.id, req.user.id, req.user.id]);
    
    return res.json(groups || []);
  } catch (error) {
    console.error('Error fetching group chats:', error);
    return res.status(500).json({ error: 'Failed to fetch group chats' });
  }
});

/**
 * @route   POST /api/messages/groups
 * @desc    Create a new group chat
 * @access  Private
 */
router.post('/groups', authMiddleware, async (req, res) => {
  try {
    const { name, description, isProject, projectId, initialMembers } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    // Create the group chat
    const groupId = require('crypto').randomUUID();
    const groupChat = await db.create('GroupChat', {
      id: groupId,
      name,
      description: description || '',
      createdBy: req.user.id,
      isProject: isProject || false,
      projectId: projectId || null
    });
    
    // Add the creator as a member and admin
    await db.create('GroupChatMember', {
      id: require('crypto').randomUUID(),
      groupId,
      userId: req.user.id,
      isAdmin: true
    });
    
    // Add initial members if provided
    if (initialMembers && Array.isArray(initialMembers) && initialMembers.length > 0) {
      for (const memberId of initialMembers) {
        // Check if user exists
        const user = await db.findOne('User', { id: memberId });
        if (user) {
          await db.create('GroupChatMember', {
            id: require('crypto').randomUUID(),
            groupId,
            userId: memberId,
            isAdmin: false
          });
        }
      }
    }
    
    // Add welcome message
    await db.create('GroupMessage', {
      id: require('crypto').randomUUID(),
      groupId,
      senderId: req.user.id,
      content: `Welcome to ${name}!`
    });
    
    return res.status(201).json(groupChat);
  } catch (error) {
    console.error('Error creating group chat:', error);
    return res.status(500).json({ error: 'Failed to create group chat' });
  }
});

/**
 * @route   GET /api/messages/groups/:groupId/messages
 * @desc    Get messages for a specific group chat
 * @access  Private
 */
router.get('/groups/:groupId/messages', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is a member of the group
    const membership = await db.findOne('GroupChatMember', { 
      groupId, 
      userId: req.user.id 
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Get messages for the group
    const messages = await db.raw(`
      SELECT gm.*,
             u.name as userName,
             u.profileImage as userImage,
             (SELECT gmr.id FROM GroupMessageRead gmr 
              WHERE gmr.messageId = gm.id AND gmr.userId = ?) as isRead
      FROM GroupMessage gm
      JOIN User u ON gm.senderId = u.id
      WHERE gm.groupId = ?
      ORDER BY gm.createdAt ASC
    `, [req.user.id, groupId]);
    
    // Mark all messages as read
    for (const message of messages) {
      if (!message.isRead) {
        try {
          await db.create('GroupMessageRead', {
            id: require('crypto').randomUUID(),
            messageId: message.id,
            userId: req.user.id
          });
        } catch (err) {
          // Ignore unique constraint errors
          if (!err.message.includes('Duplicate entry')) {
            console.error('Error marking message as read:', err);
          }
        }
      }
    }
    
    return res.json(messages || []);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

/**
 * @route   POST /api/messages/groups/:groupId/messages
 * @desc    Send a message to a group chat
 * @access  Private
 */
router.post('/groups/:groupId/messages', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Check if user is a member of the group
    const membership = await db.findOne('GroupChatMember', { 
      groupId, 
      userId: req.user.id 
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Create the message
    const messageId = require('crypto').randomUUID();
    const message = await db.create('GroupMessage', {
      id: messageId,
      groupId,
      senderId: req.user.id,
      content
    });
    
    // Mark as read by the sender
    await db.create('GroupMessageRead', {
      id: require('crypto').randomUUID(),
      messageId,
      userId: req.user.id
    });
    
    // Get user info for response
    const user = await db.findOne('User', { id: req.user.id });
    
    // Return the message with user info
    return res.status(201).json({
      ...message,
      userName: user.name,
      userImage: user.profileImage,
      isRead: true
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * @route   GET /api/messages/groups/:groupId/members
 * @desc    Get members of a group chat
 * @access  Private
 */
router.get('/groups/:groupId/members', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if user is a member of the group
    const membership = await db.findOne('GroupChatMember', { 
      groupId, 
      userId: req.user.id 
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Get members
    const members = await db.raw(`
      SELECT u.id, u.name, u.profileImage, gcm.isAdmin, gcm.joinedAt
      FROM GroupChatMember gcm
      JOIN User u ON gcm.userId = u.id
      WHERE gcm.groupId = ?
    `, [groupId]);
    
    return res.json(members || []);
  } catch (error) {
    console.error('Error fetching group members:', error);
    return res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

module.exports = router; 