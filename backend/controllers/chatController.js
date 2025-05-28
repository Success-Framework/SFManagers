import { pool } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

// Ensure Message table
// export const ensureMessageTable = async () => {
//   try {
//     const [tables] = await pool.query("SHOW TABLES LIKE 'Message'");
//     if (tables.length === 0) {
//       const createTableSQL = `
//         CREATE TABLE Message (
//           id VARCHAR(36) PRIMARY KEY,
//           content TEXT NOT NULL,
//           senderId VARCHAR(36) NOT NULL,
//           receiverId VARCHAR(36),
//           groupId VARCHAR(36),
//           startupId VARCHAR(36),
//           type VARCHAR(20) NOT NULL DEFAULT 'direct',
//           read BOOLEAN DEFAULT false,
//           createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//           updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//           INDEX idx_message_sender (senderId),
//           INDEX idx_message_receiver (receiverId),
//           INDEX idx_message_group (groupId),
//           INDEX idx_message_startup (startupId)
//         )
//       `;
//       await pool.query(createTableSQL);
//     }
//     return true;
//   } catch (error) {
//     console.error('Error ensuring Message table:', error);
//     return false;
//   }
// };

export const getChatGroups = async (req, res) => {
  try {
    const { startupId } = req.params;
    const currentUserId = req.user.id;

    const [memberCheck] = await pool.query(
      'SELECT * FROM startup_members WHERE startup_id = ? AND user_id = ?',
      [startupId, currentUserId]
    );

    if (memberCheck.length === 0) {
      res.status(403).json({ message: 'Not a member of this startup' });
      return;
    }

    const query = `
      SELECT g.*, JSON_ARRAYAGG(
        JSON_OBJECT('id', u.id, 'name', u.name, 'email', u.email)
      ) as members
      FROM chat_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN User u ON gm.user_id = u.id
      WHERE g.startup_id = ?
      GROUP BY g.id
    `;

    const [rows] = await pool.query(query, [startupId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    const currentUserId = req.user.id;

    let query = `
      SELECT m.*, 
        sender.id as sender_id, sender.name as sender_name, sender.email as sender_email,
        receiver.id as receiver_id, receiver.name as receiver_name, receiver.email as receiver_email
      FROM Message m
      LEFT JOIN User sender ON m.senderId = sender.id
      LEFT JOIN User receiver ON m.receiverId = receiver.id
      WHERE 1=1
    `;

    if (userId) {
      query += ` AND ((m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?))`;
      const [rows] = await pool.query(query, [currentUserId, userId, userId, currentUserId]);
      res.json(rows);
      return;
    }

    if (groupId) {
      query += ` AND m.groupId = ?`;
      const [rows] = await pool.query(query, [groupId]);
      res.json(rows);
      return;
    }

    res.status(400).json({ message: 'userId or groupId required' });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content, receiverId, groupId, startupId, type } = req.body;
    const senderId = req.user.id;

    if (!content) {
      res.status(400).json({ message: 'Message content is required' });
      return;
    }

    const messageId = uuidv4();
    const query = `
      INSERT INTO Message (id, content, senderId, receiverId, groupId, startupId, type, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    await pool.query(query, [
      messageId, content, senderId, receiverId, groupId, startupId, type || 'direct'
    ]);

    res.status(201).json({ id: messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, startupId, memberIds } = req.body;
    const currentUserId = req.user.id;

    if (!name || !startupId || !Array.isArray(memberIds)) {
      res.status(400).json({ message: 'Invalid group data' });
      return;
    }

    const [check] = await pool.query(
      'SELECT * FROM startup_members WHERE startup_id = ? AND user_id = ?',
      [startupId, currentUserId]
    );
    if (check.length === 0) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const groupId = uuidv4();
    await pool.query('START TRANSACTION');

    const insertGroup = `
      INSERT INTO chat_groups (id, name, startup_id, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    await pool.query(insertGroup, [groupId, name, startupId, currentUserId]);

    const members = memberIds.map(id => [groupId, id, new Date()]);
    await pool.query('INSERT INTO group_members (group_id, user_id, joined_at) VALUES ?', [members]);

    // Add creator too
    await pool.query('INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, NOW())', [groupId, currentUserId]);

    await pool.query('COMMIT');

    res.status(201).json({ id: groupId, name, startup_id: startupId, created_by: currentUserId });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};