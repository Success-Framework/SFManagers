import express, { Request, Response } from 'express';
import { pool } from '../db/db';
import authMiddleware from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Ensure Message table exists with correct schema
const ensureMessageTable = async () => {
  try {
    // First, check if the table exists
    const [tables] = await pool.query<RowDataPacket[]>("SHOW TABLES LIKE 'Message'");
    
    if (tables.length === 0) {
      console.log('Message table does not exist, creating it...');
      const createTableSQL = `
        CREATE TABLE Message (
          id VARCHAR(36) PRIMARY KEY,
          content TEXT NOT NULL,
          senderId VARCHAR(36) NOT NULL,
          receiverId VARCHAR(36),
          groupId VARCHAR(36),
          startupId VARCHAR(36),
          type VARCHAR(20) NOT NULL DEFAULT 'direct',
          read BOOLEAN DEFAULT false,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_message_sender (senderId),
          INDEX idx_message_receiver (receiverId),
          INDEX idx_message_group (groupId),
          INDEX idx_message_startup (startupId)
        )
      `;
      
      await pool.query(createTableSQL);
      console.log('Message table created successfully');
    } else {
      console.log('Message table exists, checking structure...');
      // Check the table structure
      const [columns] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM Message");
      console.log('Current Message table columns:', columns);
      
      // Check if we need to alter the table
      const hasGroupId = columns.some(col => col.Field === 'groupId');
      const hasStartupId = columns.some(col => col.Field === 'startupId');
      
      if (!hasGroupId || !hasStartupId) {
        console.log('Altering Message table to add missing columns...');
        const alterTableSQL = `
          ALTER TABLE Message
          ADD COLUMN IF NOT EXISTS groupId VARCHAR(36),
          ADD COLUMN IF NOT EXISTS startupId VARCHAR(36),
          ADD INDEX IF NOT EXISTS idx_message_group (groupId),
          ADD INDEX IF NOT EXISTS idx_message_startup (startupId)
        `;
        
        await pool.query(alterTableSQL);
        console.log('Message table altered successfully');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error managing Message table:', error);
    return false;
  }
};

// Middleware to ensure Message table exists
router.use(async (req, res, next) => {
  try {
    const success = await ensureMessageTable();
    if (!success) {
      throw new Error('Failed to ensure Message table exists');
    }
    next();
  } catch (error) {
    console.error('Error in Message table middleware:', error);
    next(error);
  }
});

// Get chat groups for a startup
router.get('/groups/:startupId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startupId } = req.params;
    const currentUserId = (req as any).user.id;

    // Check if user is a member of the startup
    const [memberCheck] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM startup_members WHERE startup_id = ? AND user_id = ?',
      [startupId, currentUserId]
    );

    if (memberCheck.length === 0) {
      res.status(403).json({ message: 'Not a member of this startup' });
      return;
    }

    const query = `
      SELECT g.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', u.id,
            'name', u.name,
            'email', u.email
          )
        ) as members
      FROM chat_groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN User u ON gm.user_id = u.id
      WHERE g.startup_id = ?
      GROUP BY g.id
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [startupId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Error fetching groups' });
  }
});

// Get messages
router.get('/messages', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, groupId } = req.query;
    const currentUserId = (req as any).user.id;

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
      const [rows] = await pool.query<RowDataPacket[]>(query, [currentUserId, userId, userId, currentUserId]);
      res.json(rows);
      return;
    }

    if (groupId) {
      query += ` AND m.groupId = ?`;
      const [rows] = await pool.query<RowDataPacket[]>(query, [groupId]);
      res.json(rows);
      return;
    }

    res.status(400).json({ message: 'Either userId or groupId must be provided' });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a message
router.post('/messages', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, receiverId, groupId, startupId, type } = req.body;
    const senderId = (req as any).user.id;

    console.log('Received message data:', { content, receiverId, groupId, startupId, type, senderId });

    if (!content) {
      res.status(400).json({ message: 'Message content is required' });
      return;
    }

    // Generate a UUID for the message
    const messageId = uuidv4();

    const query = `
      INSERT INTO Message (id, content, senderId, receiverId, groupId, startupId, type, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    console.log('Executing query with params:', [messageId, content, senderId, receiverId, groupId, startupId, type || 'direct']);

    const [result] = await pool.query<ResultSetHeader>(query, [
      messageId,
      content,
      senderId,
      receiverId,
      groupId,
      startupId,
      type || 'direct'
    ]);

    console.log('Message inserted successfully:', result);

    res.status(201).json({ id: messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: 'Error sending message', 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Create a new chat group
router.post('/groups', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, startupId, memberIds } = req.body;
    const currentUserId = (req as any).user.id;

    console.log('Creating group with data:', { name, startupId, memberIds, currentUserId });

    if (!name || !startupId || !memberIds || !Array.isArray(memberIds)) {
      res.status(400).json({ message: 'Group name, startup ID, and member IDs are required' });
      return;
    }

    // Check if user is a member of the startup
    const [memberCheck] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM startup_members WHERE startup_id = ? AND user_id = ?',
      [startupId, currentUserId]
    );

    if (memberCheck.length === 0) {
      res.status(403).json({ message: 'Not a member of this startup' });
      return;
    }

    // Generate a UUID for the group
    const groupId = uuidv4();

    // Start a transaction
    await pool.query('START TRANSACTION');

    try {
      // First, check if the chat_groups table exists
      const [tables] = await pool.query<RowDataPacket[]>("SHOW TABLES LIKE 'chat_groups'");
      if (tables.length === 0) {
        throw new Error('chat_groups table does not exist');
      }

      // Create the group
      const createGroupQuery = `
        INSERT INTO chat_groups 
        (id, name, startup_id, created_by, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      console.log('Executing create group query:', createGroupQuery, [groupId, name, startupId, currentUserId]);
      
      await pool.query(createGroupQuery, [groupId, name, startupId, currentUserId]);

      // Add members to the group
      const memberValues = memberIds.map((userId: string) => [groupId, userId, new Date()]);
      const addMembersQuery = `
        INSERT INTO group_members 
        (group_id, user_id, joined_at) 
        VALUES ?
      `;
      console.log('Executing add members query:', addMembersQuery, [memberValues]);
      
      await pool.query(addMembersQuery, [memberValues]);

      // Add the creator as a member
      const addCreatorQuery = `
        INSERT INTO group_members 
        (group_id, user_id, joined_at) 
        VALUES (?, ?, NOW())
      `;
      console.log('Executing add creator query:', addCreatorQuery, [groupId, currentUserId]);
      
      await pool.query(addCreatorQuery, [groupId, currentUserId]);

      await pool.query('COMMIT');

      res.status(201).json({
        id: groupId,
        name,
        startup_id: startupId,
        created_by: currentUserId
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error in transaction:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          sqlMessage: (error as any).sqlMessage
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ 
      message: 'Error creating group',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      sqlError: (error as any).sqlMessage
    });
  }
});

export default router; 