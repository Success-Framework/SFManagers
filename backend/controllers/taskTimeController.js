import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export const startTimer = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if task exists
    const task = await db.findOne('Task', { id: taskId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to the task
    const isAssigned = await db.findOne('TaskAssignee', { taskId, userId });
    if (!isAssigned) {
      return res.status(403).json({ error: 'Not authorized to track time for this task' });
    }

    // Update task with start time
    await db.update('Task', { id: taskId }, {
      startTime: new Date().toISOString(),
      isTimerRunning: true
    });

    res.json({ message: 'Timer started successfully' });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
};

export const pauseTimer = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if task exists
    const task = await db.findOne('Task', { id: taskId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to the task
    const isAssigned = await db.findOne('TaskAssignee', { taskId, userId });
    if (!isAssigned) {
      return res.status(403).json({ error: 'Not authorized to track time for this task' });
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
    console.error('Error pausing timer:', error);
    res.status(500).json({ error: 'Failed to pause timer' });
  }
};

export const stopTimer = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user.id;

    // Check if task exists
    const task = await db.findOne('Task', { id: taskId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to the task
    const isAssigned = await db.findOne('TaskAssignee', { taskId, userId });
    if (!isAssigned) {
      return res.status(403).json({ error: 'Not authorized to track time for this task' });
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
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
};

export const getTimeLogs = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Verify user has access to the task
    const isAssigned = await db.findOne('TaskAssignee', { taskId, userId });
    if (!isAssigned) {
      return res.status(403).json({ error: 'Not authorized to view time logs for this task' });
    }

    // Get all time logs for the task
    const timeLogs = await db.findMany('TimeTrackingLog', { taskId });

    res.json({ timeLogs });
  } catch (error) {
    console.error('Error getting time logs:', error);
    res.status(500).json({ error: 'Failed to get time logs' });
  }
};

