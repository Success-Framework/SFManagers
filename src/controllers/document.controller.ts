import { Request, Response } from 'express';
import { pool, verifyDocumentsTable } from '../db/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

interface Document extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  filePath: string;
  fileType: string;
  fileSize: number;
  startupId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: Array<{
      startupId: string;
      role: string;
    }>;
  };
}

export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, startupId } = req.body;
    const userId = (req as any).user.id;

    if (!name || !startupId) {
      res.status(400).json({ error: 'Name and startupId are required' });
      return;
    }

    const document = {
      id: req.body.id,
      name,
      description: description || null,
      filePath: req.body.filePath,
      fileType: req.body.fileType,
      fileSize: req.body.fileSize,
      startupId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO documents SET ?',
      document
    );

    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verify documents table exists
    await verifyDocumentsTable();

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      // Try to get token from headers
      const authHeader = req.headers.authorization;
      const token = req.headers['x-auth-token'] as string || 
        (authHeader && authHeader.startsWith('Bearer ')
          ? authHeader.split(' ')[1]
          : null);

      if (!token) {
        console.error('No authentication token provided');
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Verify token and get user
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        console.error('JWT_SECRET not set in environment variables');
        res.status(500).json({ error: 'Server configuration error' });
        return;
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const [users] = await pool.query<User[]>(
          'SELECT * FROM User WHERE id = ?',
          [decoded.userId]
        );

        if (!users.length) {
          console.error('User not found:', decoded.userId);
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        // Set user on request
        req.user = {
          id: users[0].id,
          email: users[0].email,
          roles: [] // We'll fetch roles if needed
        };
      } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
    }

    const userId = req.user.id;
    const { startupId } = req.query;

    if (!startupId) {
      res.status(400).json({ error: 'startupId is required' });
      return;
    }

    console.log('Fetching documents for user:', userId, 'startupId:', startupId);

    let query = `
      SELECT d.* 
      FROM documents d
      WHERE d.startupId = ?
      AND (
        d.userId = ? 
        OR EXISTS (
          SELECT 1 
          FROM UserRole ur
          JOIN Role r ON ur.roleId = r.id
          WHERE ur.userId = ? 
          AND r.startupId = d.startupId
        )
      )
    `;
    const params = [startupId, userId, userId];

    console.log('Executing query:', query, 'with params:', params);

    const [documents] = await pool.query<Document[]>(query, params);
    console.log('Query result:', documents);
    
    // Add download URLs to each document
    const documentsWithUrls = documents.map(doc => ({
      ...doc,
      downloadUrl: `/api/documents/download/${doc.id}`
    }));
    
    res.json(documentsWithUrls);
  } catch (error: any) {
    console.error('Detailed error fetching documents:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch documents',
      details: error.message 
    });
  }
};

export const getDocumentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const [documents] = await pool.query<Document[]>(
      'SELECT * FROM documents WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (documents.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(documents[0]);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const { name, description } = req.body;

    // Check if document exists and belongs to user
    const [documents] = await pool.query<Document[]>(
      'SELECT * FROM documents WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (documents.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const updateData = {
      name: name || documents[0].name,
      description: description || documents[0].description,
      updatedAt: new Date()
    };

    await pool.query<ResultSetHeader>(
      'UPDATE documents SET ? WHERE id = ?',
      [updateData, id]
    );

    res.json({ ...documents[0], ...updateData });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if document exists and belongs to user
    const [documents] = await pool.query<Document[]>(
      'SELECT * FROM documents WHERE id = ? AND userId = ?',
      [id, userId]
    );

    if (documents.length === 0) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Delete file from filesystem
    if (fs.existsSync(documents[0].filePath)) {
      fs.unlinkSync(documents[0].filePath);
    }

    // Delete from database
    await pool.query<ResultSetHeader>(
      'DELETE FROM documents WHERE id = ?',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}; 