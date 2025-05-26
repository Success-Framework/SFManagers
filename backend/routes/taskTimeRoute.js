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
router.post('/:taskId/starttimer', authMiddleware, startTimer);

// Pause timer for a task
router.post('/:taskId/pausetimer', authMiddleware, pauseTimer);

// Stop timer for a task
router.post('/:taskId/stoptimer', authMiddleware, stopTimer);

// Get time logs for a task
router.get('/:taskId/timelogs', authMiddleware, getTimeLogs);

export default router;