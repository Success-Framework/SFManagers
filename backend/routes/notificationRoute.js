import express from 'express';
import { 
//   checkNotificationsTable,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from '../controllers/notificationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to check/create notifications table
// router.use(async (req, res, next) => {
//   try {
//     await checkNotificationsTable(req, res);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Notification routes
router.get('/user', authMiddleware, getUserNotifications);
router.patch('/:id/read', authMiddleware, markNotificationAsRead);
router.patch('/mark-all-read', authMiddleware, markAllNotificationsAsRead);
router.delete('/:id', authMiddleware, deleteNotification);
router.delete('/clear-all', authMiddleware, clearAllNotifications);

export default router;