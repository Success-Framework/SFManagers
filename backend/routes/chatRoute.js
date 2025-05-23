import express from 'express';
import {
//   ensureMessageTable,
  getChatGroups,
  getMessages,
  sendMessage,
  createGroup
} from '../controllers/chatController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// router.use(async (req, res, next) => {
//   const ready = await ensureMessageTable();
//   if (!ready) return res.status(500).json({ message: 'DB setup failed' });
//   next();
// });

router.get('/groups/:startupId', authMiddleware, getChatGroups);
router.get('/messages', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);
router.post('/groups', authMiddleware, createGroup);

export default router;