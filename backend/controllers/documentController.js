import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { pool } from '../db/db.js';

// Define __dirname for ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { name, description, startupId } = req.body;
    if (!name || !startupId) return res.status(400).json({ error: 'Name and startupId are required' });

    const relativePath = path.relative(path.join(__dirname, '../..'), req.file.path).replace(/\\/g, '/');

    const document = {
      id: uuidv4(),
      name,
      description: description || null,
      filePath: relativePath,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      startupId,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await pool.query('INSERT INTO documents SET ?', document);

    res.status(201).json({
      ...document,
      downloadUrl: `/api/documents/download/${document.id}`
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [documents] = await pool.query(
      `SELECT * FROM documents 
       WHERE id = ? 
       AND (userId = ? 
       OR EXISTS (SELECT 1 FROM startup_members WHERE userId = ? AND startupId = documents.startupId))`,
      [id, userId, userId]
    );

    if (documents.length === 0) return res.status(404).json({ error: 'Document not found or access denied' });

    const document = documents[0];
    const filePath = path.join(__dirname, '../..', document.filePath);

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    res.download(filePath, document.name + path.extname(filePath));
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const [documents] = await pool.query(
      `SELECT * FROM documents 
       WHERE userId = ? 
       OR EXISTS (SELECT 1 FROM startup_members WHERE userId = ? AND startupId = documents.startupId)`,
      [userId, userId]
    );
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [documents] = await pool.query(
      `SELECT * FROM documents 
       WHERE id = ? 
       AND (userId = ? 
       OR EXISTS (SELECT 1 FROM startup_members WHERE userId = ? AND startupId = documents.startupId))`,
      [id, userId, userId]
    );
    if (documents.length === 0) return res.status(404).json({ error: 'Document not found or access denied' });
    res.json(documents[0]);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const createDocument = async (req, res) => {
  try {
    const { name, description, filePath, fileType, fileSize, startupId } = req.body;
    const document = {
      id: uuidv4(),
      name,
      description,
      filePath,
      fileType,
      fileSize,
      startupId,
      userId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await pool.query('INSERT INTO documents SET ?', document);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    await pool.query('UPDATE documents SET ? WHERE id = ?', [updates, id]);
    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM documents WHERE id = ?', [id]);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}; 