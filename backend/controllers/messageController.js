import { db } from '../database.js';
import crypto from 'crypto';

import { getIO } from '../config/socket.js';// Private Message Controllers


export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }
    
    const receiver = await db.findOne('User', { id: receiverId });
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    
    const message = await db.create('Message', {
      id: crypto.randomUUID(),
      senderId: req.user.id,
      receiverId,
      content,
      isread: false
    });
    
      // Get sender info for the message
    const sender = await db.findOne('User', { id: req.user.id });
    
    // Emit real-time message to receiver
    const io = getIO();
    io.to(`user_${receiverId}`).emit('new_private_message', {
      ...message,
      senderName: sender.name,
      senderProfileImage: sender.profileImage
    });

    // Also emit to sender for multi-device sync
    io.to(`user_${req.user.id}`).emit('message_sent', {
      ...message,
      receiverName: receiver.name,
      receiverProfileImage: receiver.profileImage
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getInboxMessages = async (req, res) => {
  try {

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

 
    const messages = await db.raw(`
      SELECT m.*, u.name as senderName, u.profileImage as senderProfileImage 
      FROM Message m
      JOIN User u ON m.senderId = u.id
      WHERE m.receiverId = ?
      ORDER BY m.createdAt DESC
    `, [req.user.id]);
    
    return res.json(messages || []);
  } catch (error) {
    console.error('Error fetching inbox messages:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch inbox messages', 
      details: error.message 
    });
  }
};

export const getSentMessages = async (req, res) => {
  try {
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
};

export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const otherUser = await db.findOne('User', { id: userId });
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
};

export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await db.findOne('Message', { id: messageId });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.receiverId !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only mark your own received messages as read' 
      });
    }
    
    const updatedMessage = await db.update('Message', 
      { id: messageId },
      { read: true }
    );
      // Emit read receipt to sender
    const io = getIO();
    io.to(`user_${message.senderId}`).emit('message_read', {
      messageId,
      readBy: req.user.id,
      readAt: new Date()
    });
    return res.json(updatedMessage);
  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await db.findOne('Message', { id: messageId });
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    if (message.senderId !== req.user.id && message.receiverId !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only delete messages you sent or received' 
      });
    }
    
    await db.delete('Message', { id: messageId });
    
    return res.json({ msg: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
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
    
    let unreadCount = 0;
    if (Array.isArray(result) && result.length > 0) {
      if (result[0][0]) {
        unreadCount = result[0][0].unreadCount || 0;
      } else {
        unreadCount = result[0].unreadCount || 0;
      }
    } else if (result && typeof result === 'object') {
      unreadCount = result.unreadCount || 0;
    }
    
    return res.json({ unreadCount });
  } catch (error) {
    console.error('Error counting unread messages:', error);
    return res.json({ unreadCount: 0 });
  }
};

// Group Message Controllers
export const getGroupChats = async (req, res) => {
  try {
    // Initialize tables if they don't exist
    try {
      const checkTable = await db.raw('SHOW TABLES LIKE "GroupChat"');
      
      if (!checkTable || checkTable.length === 0) {
        await initializeGroupChatTables(req.user.id);
      }
    } catch (tableError) {
      console.error('Error with GroupChat tables:', tableError);
      return res.status(500).json({ error: 'Group chat system not initialized properly' });
    }
    
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
};

export const createGroupChat = async (req, res) => {
  try {
    const { name, description, isProject, projectId, initialMembers } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    const groupId = crypto.randomUUID();
    const groupChat = await db.create('GroupChat', {
      id: groupId,
      name,
      description: description || '',
      createdBy: req.user.id,
      isProject: isProject || false,
      projectId: projectId || null
    });
    
    await db.create('GroupChatMember', {
      id: crypto.randomUUID(),
      groupId,
      userId: req.user.id,
      isAdmin: true
    });
    
    if (initialMembers?.length > 0) {
      for (const memberId of initialMembers) {
        const user = await db.findOne('User', { id: memberId });
        if (user) {
          await db.create('GroupChatMember', {
            id: crypto.randomUUID(),
            groupId,
            userId: memberId,
            isAdmin: false
          });
        }
      }
    }
    
    await db.create('GroupMessage', {
      id: crypto.randomUUID(),
      groupId,
      senderId: req.user.id,
      content: `Welcome to ${name}!`
    });
    
    return res.status(201).json(groupChat);
  } catch (error) {
    console.error('Error creating group chat:', error);
    return res.status(500).json({ error: 'Failed to create group chat' });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const membership = await db.findOne('GroupChatMember', { 
      groupId, 
      userId: req.user.id 
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
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
    
    for (const message of messages) {
      if (!message.isRead) {
        try {
          await db.create('GroupMessageRead', {
            id: crypto.randomUUID(),
            messageId: message.id,
            userId: req.user.id
          });
        } catch (err) {
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
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const membership = await db.findOne('GroupChatMember', { 
      groupId, 
      userId: req.user.id 
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    const messageId = crypto.randomUUID();
    const message = await db.create('GroupMessage', {
      id: messageId,
      groupId,
      senderId: req.user.id,
      content
    });
    
    await db.create('GroupMessageRead', {
      id: crypto.randomUUID(),
      messageId,
      userId: req.user.id
    });
    
    const user = await db.findOne('User', { id: req.user.id });
    const messageWithUser = {
      ...message,
      userName: user.name,
      userImage: user.profileImage,
      isRead: true
    };

    // Emit real-time message to all group members
    const io = getIO();
    io.to(`group_${groupId}`).emit('new_group_message', messageWithUser);
    return res.status(201).json({
     messageWithUser
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const membership = await db.findOne('GroupChatMember', { 
      groupId, 
      userId: req.user.id 
    });
    
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
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
};

// Helper function to initialize group chat tables
const initializeGroupChatTables = async (userId) => {
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
  
  const generalGroupId = crypto.randomUUID();
  await db.create('GroupChat', {
    id: generalGroupId,
    name: 'General Discussion',
    description: 'Chat about anything related to SFManagers',
    createdBy: userId,
    isProject: false
  });
  
  await db.create('GroupChatMember', {
    id: crypto.randomUUID(),
    groupId: generalGroupId,
    userId,
    isAdmin: true
  });
  
  await db.create('GroupMessage', {
    id: crypto.randomUUID(),
    groupId: generalGroupId,
    senderId: userId,
    content: 'Welcome to the General Discussion group chat!'
  });
  
  const supportGroupId = crypto.randomUUID();
  await db.create('GroupChat', {
    id: supportGroupId,
    name: 'Support',
    description: 'Get help with the platform',
    createdBy: userId,
    isProject: false
  });
  
  await db.create('GroupChatMember', {
    id: crypto.randomUUID(),
    groupId: supportGroupId,
    userId,
    isAdmin: true
  });
};
