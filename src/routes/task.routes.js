const express = require('express');
// const prisma = require('../prisma').default; // Remove prisma import
const { db } = require('../database'); // Add db adapter
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Helper function to check if a user is a member of a startup
async function isStartupMember(userId, startupId) {
  // Check if user is the startup owner
  const startup = await db.findOne('Startup', { id: startupId });
  
  if (startup && startup.ownerId === userId) {
    return true;
  }
  
  // Check if user has a role in the startup
  // Search for user_roles where userId matches and role's startupId matches
  const userRolesQuery = `
    SELECT ur.* 
    FROM user_roles ur
    JOIN roles r ON ur.roleId = r.id
    WHERE ur.userId = ? AND r.startupId = ?
  `;
  const userRoles = await db.raw(userRolesQuery, [userId, startupId]);
  
  return userRoles && userRoles.length > 0;
}

// Initialize task statuses for a startup if they don't exist
async function initializeTaskStatuses(startupId) {
  const existingStatuses = await db.findMany('TaskStatus', { startupId });
  
  if (existingStatuses.length === 0) {
    const defaultStatuses = ['To Do', 'In Progress', 'Done'];
    
    for (const status of defaultStatuses) {
      await db.create('TaskStatus', {
        id: require('uuid').v4(),
          name: status,
        startupId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
}

// Get task statuses for a startup
router.get('/statuses/:startupId', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to access this startup' });
    }
    
    // Initialize statuses if they don't exist
    await initializeTaskStatuses(startupId);
    
    // Get all statuses for the startup
    const statuses = await db.findMany('TaskStatus', { startupId });
    
    res.json(statuses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all tasks for a specific startup
router.get('/startup/:startupId', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to access this startup' });
    }
    
    // Get all tasks for the startup with related data using raw SQL query
    const tasksQuery = `
      SELECT t.*, ts.id AS statusId, ts.name AS statusName, 
             u.id AS creatorId, u.name AS creatorName, u.email AS creatorEmail
      FROM Task t
      LEFT JOIN TaskStatus ts ON t.statusId = ts.id
      LEFT JOIN User u ON t.createdBy = u.id
      WHERE t.startupId = ?
    `;
    const tasks = await db.raw(tasksQuery, [startupId]);
    
    if (!tasks || !tasks.length) {
      return res.json([]);
    }
    
    // Get assignees for each task
    const tasksWithAssignees = await Promise.all(tasks.map(async (task) => {
      const assigneesQuery = `
        SELECT u.id, u.name, u.email 
        FROM TaskAssignee ta
        JOIN User u ON ta.userId = u.id
        WHERE ta.taskId = ?
      `;
      const assignees = await db.raw(assigneesQuery, [task.id]);
      
      return {
        ...task,
        status: {
          id: task.statusId,
          name: task.statusName
        },
        creator: {
          id: task.creatorId,
          name: task.creatorName,
          email: task.creatorEmail
        },
        assignees: assignees || []
      };
    }));
    
    res.json(tasksWithAssignees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, priority, dueDate, statusId, assigneeIds, startupId } = req.body;
    console.log('Creating new task:', { title, statusId, startupId, assigneeIds });
    
    // Validate required fields
    if (!title || !statusId || !startupId) {
      console.error('Missing required fields:', { title, statusId, startupId });
      return res.status(400).json({ message: 'Title, status and startup are required' });
    }

    // Check user permission using isStartupMember function
    const hasPermission = await isStartupMember(req.user.id, startupId);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to create tasks for this startup' });
    }

    // Create task with a UUID
    const taskId = require('uuid').v4();
    
    // Prepare task data
    const taskData = {
      id: taskId,
        title,
        description: description || '',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
      statusId,
      startupId,
      createdBy: req.user.id,
      totalTimeSpent: 0,
      isTimerRunning: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the task
    await db.create('Task', taskData);
    console.log('Task created successfully with ID:', taskId);
    
    // Handle assignees if provided
    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      console.log('Adding assignees for task:', assigneeIds);
      
      // Create assignees one by one
      for (const assigneeId of assigneeIds) {
        const assigneeUuid = require('uuid').v4();
        await db.create('TaskAssignee', {
          id: assigneeUuid,
          taskId: taskId,
          userId: assigneeId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      console.log(`Added ${assigneeIds.length} assignees to task`);
    }
    
    // Get the complete task with related data for the response
    const statusData = await db.findOne('TaskStatus', { id: statusId });
    const creatorData = await db.findOne('User', { id: req.user.id }, ['id', 'name', 'email']);
    
    let assignees = [];
    if (assigneeIds && assigneeIds.length > 0) {
      // Get assignees data
      const assigneesQuery = `
        SELECT u.id, u.name, u.email 
        FROM User u
        WHERE u.id IN (${assigneeIds.map(() => '?').join(',')})
      `;
      assignees = await db.raw(assigneesQuery, assigneeIds);
    }
    
    // Prepare the response data
    const responseData = {
      ...taskData,
      status: statusData,
      creator: creatorData,
      assignees: assignees || []
    };
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

// Update task status via drag and drop
router.patch('/:taskId/status', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { statusId } = req.body;
    const userId = req.user.id;
    
    // Validate data
    if (!statusId) {
      return res.status(400).json({ msg: 'Status ID is required' });
    }
    
    // Get the task with startup info to verify permissions
    const taskQuery = `
      SELECT t.*, s.id AS startupId, s.name AS startupName, s.ownerId AS startupOwnerId,
             ts.id AS statusId, ts.name AS statusName
      FROM Task t
      JOIN Startup s ON t.startupId = s.id
      JOIN TaskStatus ts ON t.statusId = ts.id
      WHERE t.id = ?
    `;
    const taskResults = await db.raw(taskQuery, [taskId]);
    
    if (!taskResults || !taskResults.length) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    const task = taskResults[0];
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, task.startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }
    
    // Get the new status
    const newStatus = await db.findOne('TaskStatus', { id: statusId });
    
    if (!newStatus) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    // Check if the task is being moved to 'Done' status
    const isCompletingTask = newStatus.name === 'Done' && task.statusName !== 'Done';
    
    // Update the task status
    const updatedTask = await db.update('Task', taskId, {
      statusId,
      updatedAt: new Date()
    });
    
    // Get assignees for task
    const assigneesQuery = `
      SELECT u.id, u.name, u.email 
      FROM TaskAssignee ta
      JOIN User u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `;
    const assignees = await db.raw(assigneesQuery, [taskId]);
    
    // If the task is being completed, award points to assignees
    if (isCompletingTask && assignees && assignees.length > 0) {
      const assigneeIds = assignees.map(assignee => assignee.id);
      
      // Award 2 points to each assignee
      for (const assigneeId of assigneeIds) {
        try {
          // Record the points transaction
          const transactionId = require('uuid').v4();
          await db.create('PointsTransaction', {
            id: transactionId,
            userId: assigneeId,
            points: 2,
            reason: 'Completed a task',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Get current user points
          const user = await db.findOne('User', { id: assigneeId });
          
          // Update user's points
          const newPoints = (user.points || 0) + 2;
          await db.update('User', assigneeId, {
            points: newPoints,
            updatedAt: new Date()
          });
          
          // Update user's level if needed
          const newLevel = Math.floor(newPoints / 100) + 1;
          if (user.level !== newLevel) {
            await db.update('User', assigneeId, { 
              level: newLevel,
              updatedAt: new Date()
            });
          }
        } catch (err) {
          console.error(`Error awarding points to user ${assigneeId}:`, err);
          // Don't fail the request if points awarding fails
        }
      }
    }
    
    // Get creator data
    const creator = await db.findOne('User', { id: task.createdBy }, ['id', 'name', 'email']);
    
    // Get updated status data
    const status = await db.findOne('TaskStatus', { id: statusId });
    
    // Prepare complete response
    const responseData = {
      ...updatedTask,
      status,
      creator,
      assignees: assignees || []
    };
    
    res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a task
router.put('/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, dueDate, statusId, assigneeIds } = req.body;
    const userId = req.user.id;
    
    // Get the task to verify permissions
    const task = await db.findOne('Task', { id: taskId });
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, task.startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }
    
    // Handle updating assignees if provided
    if (assigneeIds !== undefined) {
      // First, delete all existing assignees
      await db.delete('TaskAssignee', { taskId });
      
      // Then add the new assignees if any are provided
      if (assigneeIds && assigneeIds.length > 0) {
        await Promise.all(assigneeIds.map(assigneeId => {
          const assigneeUuid = require('uuid').v4();
          return db.create('TaskAssignee', {
            id: assigneeUuid,
            taskId,
            userId: assigneeId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }));
      }
    }
    
    // Update the task fields
    const updatedTask = await db.update('Task', taskId, {
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        priority: priority !== undefined ? priority : task.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      statusId: statusId || task.statusId,
      updatedAt: new Date()
    });
    
    // Get status
    const status = await db.findOne('TaskStatus', { id: updatedTask.statusId });
    
    // Get creator
    const creator = await db.findOne('User', { id: updatedTask.createdBy }, ['id', 'name', 'email']);
    
    // Get assignees
    const assigneesQuery = `
      SELECT u.id, u.name, u.email 
      FROM TaskAssignee ta
      JOIN User u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `;
    const assignees = await db.raw(assigneesQuery, [taskId]);
    
    // Prepare response data
    const responseData = {
      ...updatedTask,
      status,
      creator,
      assignees: assignees || []
    };
    
    res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a task
router.delete('/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // Get the task and startup to verify permissions
    const taskQuery = `
      SELECT t.*, s.ownerId AS startupOwnerId 
      FROM Task t
      JOIN Startup s ON t.startupId = s.id
      WHERE t.id = ?
    `;
    const taskResults = await db.raw(taskQuery, [taskId]);
    
    if (!taskResults || !taskResults.length) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    const task = taskResults[0];
    
    // Check if user is the startup owner or the task creator
    const isOwner = task.startupOwnerId === userId;
    const isCreator = task.createdBy === userId;
    
    if (!isOwner && !isCreator) {
      return res.status(403).json({ msg: 'Not authorized to delete this task' });
    }
    
    // Delete all task assignees first
    await db.delete('TaskAssignee', { taskId });
    
    // Delete any time tracking logs
    await db.delete('TimeTrackingLog', { taskId });
    
    // Delete the task
    await db.delete('Task', { id: taskId });
    
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all tasks assigned to the current user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Starting user tasks query with userId:', userId);
    
    // Use direct pool execution to bypass the table name mapping
    const mysql = require('mysql2/promise');
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    // Direct SQL query using the correct table names
    const tasksQuery = `
      SELECT 
        t.*,
        ts.id AS statusId, 
        ts.name AS statusName,
        s.id AS startupId, 
        s.name AS startupName,
        u.id AS creatorId, 
        u.name AS creatorName, 
        u.email AS creatorEmail
      FROM 
        Task t
      JOIN 
        TaskAssignee ta ON t.id = ta.taskId
      JOIN 
        TaskStatus ts ON t.statusId = ts.id
      JOIN 
        Startup s ON t.startupId = s.id
      JOIN 
        User u ON t.createdBy = u.id
      WHERE 
        ta.userId = ?
      ORDER BY 
        t.dueDate ASC
    `;
    
    console.log('Executing user tasks query directly with pool.execute to bypass table mapping');
    
    // Execute the query directly
    const [tasks] = await pool.execute(tasksQuery, [userId]);
    
    if (!tasks || !tasks.length) {
      await pool.end();
      return res.json([]);
    }
    
    // Get assignees for each task - also using direct queries
    const tasksWithAssignees = await Promise.all(tasks.map(async (task) => {
      const assigneesQuery = `
        SELECT u.id, u.name, u.email 
        FROM TaskAssignee ta
        JOIN User u ON ta.userId = u.id
        WHERE ta.taskId = ?
      `;
      const [assignees] = await pool.execute(assigneesQuery, [task.id]);
      
      return {
        ...task,
        status: {
          id: task.statusId,
          name: task.statusName
        },
        startup: {
          id: task.startupId,
          name: task.startupName
        },
        creator: {
          id: task.creatorId,
          name: task.creatorName,
          email: task.creatorEmail
        },
        assignees: assignees || []
      };
    }));
    
    // Close the pool
    await pool.end();
    
    res.json(tasksWithAssignees);
  } catch (err) {
    console.error('Error in user tasks query:', err);
    res.status(500).send('Server Error');
  }
});

// Start timer for a task
router.post('/:taskId/timer/start', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // Find the task with assignees
    const taskQuery = `
      SELECT t.* FROM Task t WHERE t.id = ?
    `;
    const taskResults = await db.raw(taskQuery, [taskId]);
    
    if (!taskResults || !taskResults.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskResults[0];
    
    // Get assignees to check permissions
    const assigneeQuery = `
      SELECT userId FROM TaskAssignee WHERE taskId = ?
    `;
    const assignees = await db.raw(assigneeQuery, [taskId]);
    
    // Check if user has permission to track time for this task
    const isAssignee = assignees.some(assignee => assignee.userId === userId);
    const isCreator = task.createdBy === userId;
    
    if (!isAssignee && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to track time for this task' });
    }
    
    // Check if timer is already running
    if (task.isTimerRunning) {
      return res.status(400).json({ error: 'Timer is already running for this task' });
    }
    
    // Start the timer
    const now = new Date();
    const updatedTask = await db.update('Task', taskId, {
        isTimerRunning: true,
      timerStartedAt: now,
      updatedAt: now
    });
    
    // Get full data for response
    const statusData = await db.findOne('TaskStatus', { id: updatedTask.statusId });
    
    // Get creator data
    const creatorData = await db.findOne('User', { id: updatedTask.createdBy }, ['id', 'name', 'email']);
    
    // Get assignees for response
    const assigneesQuery = `
      SELECT u.id, u.name, u.email 
      FROM TaskAssignee ta
      JOIN User u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `;
    const assigneesData = await db.raw(assigneesQuery, [taskId]);
    
    // Prepare response data
    const responseData = {
      ...updatedTask,
      status: statusData,
      creator: creatorData,
      assignees: assigneesData || []
    };
    
    return res.status(200).json({
      message: 'Timer started successfully',
      task: responseData
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    return res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Pause timer for a task
router.post('/:taskId/timer/pause', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { note } = req.body;
    
    // Find the task with assignees
    const taskQuery = `
      SELECT t.* FROM Task t WHERE t.id = ?
    `;
    const taskResults = await db.raw(taskQuery, [taskId]);
    
    if (!taskResults || !taskResults.length) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskResults[0];
    
    // Get assignees to check permissions
    const assigneeQuery = `
      SELECT userId FROM TaskAssignee WHERE taskId = ?
    `;
    const assignees = await db.raw(assigneeQuery, [taskId]);
    
    // Check if user has permission
    const isAssignee = assignees.some(assignee => assignee.userId === userId);
    const isCreator = task.createdBy === userId;
    
    if (!isAssignee && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to track time for this task' });
    }
    
    // Check if timer is running
    if (!task.isTimerRunning) {
      return res.status(400).json({ error: 'Timer is not running for this task' });
    }
    
    // Calculate time spent in this session
    const now = new Date();
    const startTime = new Date(task.timerStartedAt);
    const sessionDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    // Create a time tracking log
    const timeLogId = require('uuid').v4();
    const timeTrackingLog = await db.create('TimeTrackingLog', {
      id: timeLogId,
      taskId,
      userId,
        startTime: task.timerStartedAt,
        endTime: now,
        duration: sessionDuration,
      note: note || '',
      createdAt: now,
      updatedAt: now
    });
    
    // Get user data for the log
    const user = await db.findOne('User', { id: userId }, ['id', 'name', 'email']);
    const timeLogWithUser = {
      ...timeTrackingLog,
      user
    };
    
    // Update task with new total time and reset timer
    const updatedTask = await db.update('Task', taskId, {
        totalTimeSpent: (task.totalTimeSpent || 0) + sessionDuration,
        isTimerRunning: false,
      timerStartedAt: null,
      updatedAt: now
    });
    
    // Get full data for response
    const statusData = await db.findOne('TaskStatus', { id: updatedTask.statusId });
    
    // Get creator data
    const creatorData = await db.findOne('User', { id: updatedTask.createdBy }, ['id', 'name', 'email']);
    
    // Get assignees for response
    const assigneesQuery = `
      SELECT u.id, u.name, u.email 
      FROM TaskAssignee ta
      JOIN User u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `;
    const assigneesData = await db.raw(assigneesQuery, [taskId]);
    
    // Prepare response data
    const responseData = {
      ...updatedTask,
      status: statusData,
      creator: creatorData,
      assignees: assigneesData || []
    };
    
    return res.status(200).json({
      message: 'Timer paused successfully',
      task: responseData,
      timeLog: timeLogWithUser
    });
  } catch (error) {
    console.error('Error pausing timer:', error);
    return res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// Get time logs for a task
router.get('/:taskId/time-logs', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // Find the task
    const task = await db.findOne('Task', { id: taskId });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has permission
    const isAssignee = await db.findOne('TaskAssignee', { taskId, userId });
    const isCreator = task.createdBy === userId;
    const isMember = await isStartupMember(userId, task.startupId);
    
    if (!isAssignee && !isCreator && !isMember) {
      return res.status(403).json({ error: 'Not authorized to view time logs for this task' });
    }
    
    // Get time logs with user information
    const timeLogsQuery = `
      SELECT tl.*, u.id AS userId, u.name AS userName, u.email AS userEmail
      FROM TimeTrackingLog tl
      JOIN User u ON tl.userId = u.id
      WHERE tl.taskId = ?
      ORDER BY tl.startTime DESC
    `;
    const timeLogs = await db.raw(timeLogsQuery, [taskId]);
    
    if (!timeLogs || !timeLogs.length) {
      return res.status(200).json([]);
    }
    
    // Transform logs to include user object
    const transformedLogs = timeLogs.map(log => ({
      ...log,
        user: {
        id: log.userId,
        name: log.userName,
        email: log.userEmail
      }
    }));
    
    return res.status(200).json(transformedLogs);
  } catch (error) {
    console.error('Error getting time logs:', error);
    return res.status(500).json({ error: 'Failed to get time logs' });
  }
});

// Stop timer and save time
router.post('/:taskId/timer/stop', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { note } = req.body;

    // Get the task
    const task = await db.findOne('Task', { id: taskId });

    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, task.startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to stop timer for this task' });
    }

    if (!task.isTimerRunning || !task.timerStartedAt) {
      return res.status(400).json({ msg: 'Timer is not running' });
    }

    // Calculate time spent in this session
    const now = new Date();
    const sessionDuration = Math.floor((now - new Date(task.timerStartedAt)) / 1000);
    const totalTimeSpent = (task.totalTimeSpent || 0) + sessionDuration;

    // Create time tracking log
    const timeLogId = require('uuid').v4();
    const timeLog = await db.create('TimeTrackingLog', {
      id: timeLogId,
        taskId,
        userId,
        startTime: task.timerStartedAt,
        endTime: now,
        duration: sessionDuration,
      note: note || "",
      createdAt: now,
      updatedAt: now
    });
    
    // Get user data for log
    const userData = await db.findOne('User', { id: userId }, ['id', 'name', 'email']);
    
    // Complete time log with user data
    const completeTimeLog = {
      ...timeLog,
      user: userData
    };

    // Update task with new total time and stop timer
    const updatedTask = await db.update('Task', taskId, {
        totalTimeSpent,
        isTimerRunning: false,
      timerStartedAt: null,
      updatedAt: now
    });

    // Get full data for response
    const statusData = await db.findOne('TaskStatus', { id: updatedTask.statusId });
    
    // Get creator data
    const creatorData = await db.findOne('User', { id: updatedTask.createdBy }, ['id', 'name', 'email']);
    
    // Get assignees for response
    const assigneesQuery = `
      SELECT u.id, u.name, u.email 
      FROM TaskAssignee ta
      JOIN User u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `;
    const assigneesData = await db.raw(assigneesQuery, [taskId]);
    
    // Prepare response data
    const responseData = {
      ...updatedTask,
      status: statusData,
      creator: creatorData,
      assignees: assigneesData || []
    };

    return res.status(200).json({
      message: 'Timer stopped successfully',
      task: responseData,
      timeLog: completeTimeLog
    });
  } catch (err) {
    console.error('Error stopping timer:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 