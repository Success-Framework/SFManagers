import express from 'express';
import { 
  startTimer, 
  pauseTimer, 
  stopTimer,
  getTimeLogs
} from '../controllers/taskTimeController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Start timer for a task
router.post('/:taskId/start-timer', authMiddleware, startTimer);

// Pause timer for a task
router.post('/:taskId/pause-timer', authMiddleware, pauseTimer);

// Stop timer for a task
router.post('/:taskId/stop-timer', authMiddleware, stopTimer);

// Get time logs for a task
router.get('/:taskId/time-logs', authMiddleware, getTimeLogs);

export default router;