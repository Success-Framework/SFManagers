import express, { Request, Response, RequestHandler } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
} from '../controllers/document.controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/db';
import authMiddleware from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

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

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  }
});

// Upload document
router.post('/upload', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { name, description, startupId } = req.body;
    if (!name || !startupId) {
      res.status(400).json({ error: 'Name and startupId are required' });
      return;
    }

    // Store relative path instead of absolute path
    const relativePath = path.relative(
      path.join(__dirname, '../..'),
      req.file.path
    ).replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes

    const document = {
      id: uuidv4(),
      name,
      description: description || null,
      filePath: relativePath,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      startupId,
      userId: (req as any).user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [result] = await pool.query(
      'INSERT INTO documents SET ?',
      document
    );

    res.status(201).json({
      ...document,
      downloadUrl: `/api/documents/download/${document.id}`
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Download document
router.get('/download/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Get document from database
    const [documents] = await pool.query<Document[]>(
      'SELECT * FROM documents WHERE id = ? AND (userId = ? OR EXISTS (SELECT 1 FROM startup_members WHERE userId = ? AND startupId = documents.startupId))',
      [id, userId, userId]
    );

    if (documents.length === 0) {
      res.status(404).json({ error: 'Document not found or access denied' });
      return;
    }

    const document = documents[0];
    const filePath = path.join(__dirname, '../..', document.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.download(filePath, document.name + path.extname(filePath));
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

router.get('/', getDocuments as RequestHandler);
router.get('/:id', getDocumentById as RequestHandler);
router.post('/', createDocument as RequestHandler);
router.put('/:id', updateDocument as RequestHandler);
router.delete('/:id', deleteDocument as RequestHandler);

export default router; 