import express from 'express';
import {
  uploadDocument,
  downloadDocument,
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument
} from '../controllers/documentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define __dirname for ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.get('/download/:id', authMiddleware, downloadDocument);
router.get('/', authMiddleware, getDocuments);
router.get('/:id', authMiddleware, getDocumentById);
router.post('/', authMiddleware, createDocument);
router.put('/:id', authMiddleware, updateDocument);
router.delete('/:id', authMiddleware, deleteDocument);

export default router;
