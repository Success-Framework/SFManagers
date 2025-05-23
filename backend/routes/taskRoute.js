import express from 'express';
import { 
  getTaskStatuses,
  getStartupTasks,
  createTask,
  updateTaskStatus,
  startTimer,
  getFreelanceTasks,
  acceptFreelanceTask,
  cancelFreelanceTask,
  getMyFreelanceTasks,
  stopTimer,
  getTimeLogs,
  deleteTask,
  updateTask
} from '../controllers/taskController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Task status routes
router.get('/statuses/:startupId', authMiddleware, getTaskStatuses);

// Task routes
router.get('/startup/:startupId', authMiddleware, getStartupTasks);
router.post('/', authMiddleware, createTask);
router.patch('/:taskId/status', authMiddleware, updateTaskStatus);
router.put('/:taskId', authMiddleware, updateTask);

// Timer routes
router.post('/:taskId/timer/start', authMiddleware, startTimer);
router.post('/:taskId/timer/stop', authMiddleware, stopTimer);
router.post('/:taskId/timer/pause', authMiddleware, async (req, res) => {
  // Existing pause timer logic
});

// Freelance routes
router.get('/freelance', authMiddleware, getFreelanceTasks);
router.get('/freelance/my', authMiddleware, getMyFreelanceTasks);
router.post('/freelance/accept/:taskId', authMiddleware, acceptFreelanceTask);
router.post('/freelance/cancel/:taskId', authMiddleware, cancelFreelanceTask);

// Time logs route
router.get('/:taskId/time-logs', authMiddleware, getTimeLogs);

// Delete task route
router.delete('/:taskId', authMiddleware, deleteTask);

export default router;