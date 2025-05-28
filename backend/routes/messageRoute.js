import express from 'express';
import {
  sendMessage,
  getInboxMessages,
  getSentMessages,
  getConversation,
  markMessageAsRead,
  deleteMessage,
  getUnreadCount,
  getGroupChats,
  createGroupChat,
  getGroupMessages,
  sendGroupMessage,
  getGroupMembers
} from '../controllers/messageController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  return res.json({ message: 'Message routes are working!' });
});

// Private message routes
router.post('/', authMiddleware, sendMessage);
router.get('/inbox', authMiddleware, getInboxMessages);
router.get('/sent', authMiddleware, getSentMessages);
router.get('/conversation/:userId', authMiddleware, getConversation);
router.put('/:messageId/read', authMiddleware, markMessageAsRead);
router.delete('/:messageId', authMiddleware, deleteMessage);
router.get('/unread-count', authMiddleware, getUnreadCount);

// Group message routes
router.get('/groups', authMiddleware, getGroupChats);
router.post('/groups', authMiddleware, createGroupChat);
router.get('/groups/:groupId/messages', authMiddleware, getGroupMessages);
router.post('/groups/:groupId/messages', authMiddleware, sendGroupMessage);
router.get('/groups/:groupId/members', authMiddleware, getGroupMembers);


export default router;
