import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../database';
import authMiddleware from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

// Start timer for a task
router.post('/:taskId/start-timer', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if task exists and user has access
    const task = await db.findOne('Task', { id: taskId });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if user is assigned to the task
    const isAssigned = await db.findOne('TaskAssignee', { taskId, userId });
    if (!isAssigned) {
      res.status(403).json({ error: 'Not authorized to track time for this task' });
      return;
    }

    // Update task with start time
    await db.update('Task', { id: taskId }, {
      startTime: new Date().toISOString(),
      isTimerRunning: true
    });

    res.json({ message: 'Timer started successfully' });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Pause timer for a task
router.post('/:taskId/pause-timer', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if task exists and user has access
    const task = await db.findOne('Task', { id: taskId });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if user is assigned to the task
    const isAssigned = await db.findOne('TaskAssignee', { taskId, userId });
    if (!isAssigned) {
      res.status(403).json({ error: 'Not authorized to track time for this task' });
      return;
    }

    // Calculate time spent
    const startTime = new Date(task.startTime);
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update task with pause time and total time spent
    await db.update('Task', { id: taskId }, {
      endTime: endTime.toISOString(),
      isTimerRunning: false,
      totalTimeSpent: (task.totalTimeSpent || 0) + timeSpent
    });

    res.json({ message: 'Timer paused successfully' });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Stop timer for a task
router.post('/:taskId/stop-timer', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user.id;

    // Check if task exists and user has access
    const task = await db.findOne('Task', { id: taskId });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Check if user is assigned to the task
    const isAssigned = await db.findOne('TaskAssignee', { taskId, userId });
    if (!isAssigned) {
      res.status(403).json({ error: 'Not authorized to track time for this task' });
      return;
    }

    // Update task with stop time and total time spent
    await db.update('Task', { id: taskId }, {
      endTime: new Date().toISOString(),
      isTimerRunning: false,
      totalTimeSpent: timeSpent
    });

    // Create time tracking log
    await db.create('TimeTrackingLog', {
      id: uuidv4(),
      taskId,
      userId,
      startTime: task.startTime,
      endTime: new Date().toISOString(),
      duration: timeSpent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Timer stopped successfully' });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router; 