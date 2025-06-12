import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { validateCreateTask } from '../validator/taskValidator.js';
dotenv.config();

// Helper functions
async function isStartupMember(userId, startupId) {
  const startup = await db.findOne('Startup', { id: startupId });
  if (startup && startup.ownerId === userId) {
    return true;
  }

  const userRolesQuery = `
    SELECT ur.* 
    FROM UserRole ur
    JOIN Role r ON ur.roleId = r.id
    WHERE ur.userId = ? AND r.startupId = ?
  `;
  const userRoles = await db.raw(userRolesQuery, [userId, startupId]);
  return userRoles && userRoles.length > 0;
}

async function initializeTaskStatuses(startupId) {
  const existingStatuses = await db.findMany('TaskStatus', { startupId });
  
  if (existingStatuses.length === 0) {
    const defaultStatuses = ['To Do', 'In Progress', 'Done'];
    
    for (const status of defaultStatuses) {
      await db.create('TaskStatus', {
        id: uuidv4(),
        name: status,
        startupId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
}

function calculateUrgencyLevel(estimatedHours, dueDate) {
  if (!dueDate) return 'MEDIUM';
  
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'CRITICAL';
  
  const urgencyScore = (estimatedHours / Math.max(diffDays, 1)) * 100;
  
  if (urgencyScore > 80) return 'CRITICAL';
  if (urgencyScore > 50) return 'HIGH';
  if (urgencyScore > 30) return 'MEDIUM';
  return 'LOW';
}

export const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Starting user tasks query with userId:', userId);

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });

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
    const [tasks] = await pool.execute(tasksQuery, [userId]);

    if (!tasks || !tasks.length) {
      await pool.end();
      return res.json([]);
    }

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

    await pool.end();
    res.json(tasksWithAssignees);
  } catch (err) {
    console.error('Error in user tasks query:', err);
    res.status(500).send('Server Error');
  }
};
// Controller functions
export const getTaskStatuses = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    const isMember = await isStartupMember(userId, startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to access this startup' });
    }
    
    await initializeTaskStatuses(startupId);
    const statuses = await db.findMany('TaskStatus', { startupId });
    res.json(statuses);
  } catch (err) {
    console.error('Error fetching task statuses:', err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message
    });
  }
};

export const getStartupTasks = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    const isMember = await isStartupMember(userId, startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to access this startup' });
    }
    
    const statuses = await db.findMany('TaskStatus', { startupId });
    if (!statuses || statuses.length === 0) {
      await initializeTaskStatuses(startupId);
    }
    
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
        console.log('No tasks found, returning empty array');
        return res.json([]);
      }
    
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
        status: { id: task.statusId, name: task.statusName },
        creator: { id: task.creatorId, name: task.creatorName, email: task.creatorEmail },
        assignees: assignees || []
      };
    }));
    
    res.json(tasksWithAssignees);
  } catch (err) {
    console.error('Error in /startup/:startupId route:', err);
    res.status(500).json({ 
      error: 'Server Error',
      details: err.message
    });
  }
};

export const createTask = async (req, res) => {
  try {
    // Validate the request body using the Zod schema
    const validatedData = validateCreateTask(req.body);

    const { 
      title, description, priority, dueDate, statusId, 
      assigneeIds, startupId, isFreelance, estimatedHours,
      hourlyRate, basePoints, totalPoints, department, teamName
    } = validatedData; // Use validated data

    if (!title || !statusId || !startupId) {
      return res.status(400).json({ message: 'Title, status and startup are required' });
    }

    const hasPermission = await isStartupMember(req.user.id, startupId);
    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to create tasks for this startup' });
    }

    let urgencyLevel = 'MEDIUM';
    if (isFreelance && dueDate) {
      urgencyLevel = calculateUrgencyLevel(estimatedHours || 1, dueDate);
    }
    
    let taskBasePoints = 0;
    let taskTotalPoints = 0;
    
    if (isFreelance) {
      taskBasePoints = basePoints || Math.round((estimatedHours || 0) * (hourlyRate || 0));
      
      let pointsMultiplier = 1.0;
      switch (urgencyLevel) {
        case 'CRITICAL': pointsMultiplier = 2.0; break;
        case 'HIGH': pointsMultiplier = 1.5; break;
        case 'MEDIUM': pointsMultiplier = 1.2; break;
        default: pointsMultiplier = 1.0;
      }
      
      taskTotalPoints = Math.round(taskBasePoints * pointsMultiplier);
    }

    const taskId = uuidv4();
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
      isFreelance: isFreelance === true ? 1 : 0,
      freelancerId: null,
      estimatedHours: isFreelance ? estimatedHours || 0 : 0,
      hourlyRate: isFreelance ? hourlyRate || 0 : 0,
      urgencyLevel,
      basePoints: taskBasePoints,
      pointsMultiplier: isFreelance ? (taskBasePoints > 0 ? taskTotalPoints / taskBasePoints : 1.0) : 1.0,
      totalPoints: taskTotalPoints,
      createdAt: new Date(),
      updatedAt: new Date(),
      department,
      teamName
    };

    await db.create('Task', taskData);
    
    if (!isFreelance && assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      for (const assigneeId of assigneeIds) {
        await db.create('TaskAssignee', {
          id: uuidv4(),
          taskId,
          userId: assigneeId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    const statusData = await db.findOne('TaskStatus', { id: statusId });
    const creatorData = await db.findOne('User', { id: req.user.id }, ['id', 'name', 'email']);
    
    let assignees = [];
    if (assigneeIds && assigneeIds.length > 0) {
      const assigneesQuery = `
        SELECT u.id, u.name, u.email 
        FROM User u
        WHERE u.id IN (${assigneeIds.map(() => '?').join(',')})
      `;
      assignees = await db.raw(assigneesQuery, assigneeIds);
    }
    
    const responseData = {
      ...taskData,
      status: statusData,
      creator: creatorData,
      assignees: assignees || []
    };
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: error.message }); // Send a response with the error message
  }
};

// ... Additional controller functions for other routes ...

// Fast endpoint optimized specifically for drag-and-drop status updates
export const updateTaskStatusFast = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status_id: statusId } = req.body;
    const userId = req.user.id;
    
    if (!statusId) {
      return res.status(400).json({ msg: 'Status ID is required' });
    }
    
    // Simplified query to check if task exists and user has permission
    const taskQuery = `
      SELECT t.id, t.startupId
      FROM Task t
      JOIN Startup s ON t.startupId = s.id
      WHERE t.id = ?
    `;
    const taskResults = await db.raw(taskQuery, [taskId]);
    
    if (!taskResults || !taskResults.length) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    const task = taskResults[0];
    const isMember = await isStartupMember(userId, task.startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }
    
    // Log the update we're about to perform
    console.log(`Updating task ${taskId} with statusId ${statusId}`);
    
    // Just update the statusId without fetching additional data
    // Make sure we're only updating columns that exist in the database
    await db.update('Task', taskId, {
      statusId: statusId,  // Be explicit about the column name
      updatedAt: new Date()
    });
    
    // Return minimal response
    res.json({ success: true, taskId, statusId });
  } catch (err) {
    console.error('Error in fast status update:', err.message);
    res.status(500).send('Server Error');
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {  status_id: statusId } = req.body;
    const userId = req.user.id;
    
    if (!statusId) {
      return res.status(400).json({ msg: 'Status ID is required' });
    }
    
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
    const isMember = await isStartupMember(userId, task.startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }
    
    const newStatus = await db.findOne('TaskStatus', { id: statusId });
    if (!newStatus) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    const isCompletingTask = newStatus.name === 'Done' && task.statusName !== 'Done';
    const updatedTask = await db.update('Task', taskId, {
      statusId,
      updatedAt: new Date()
    });
    
    const assigneesQuery = `
      SELECT u.id, u.name, u.email 
      FROM TaskAssignee ta
      JOIN User u ON ta.userId = u.id
      WHERE ta.taskId = ?
    `;
    const assignees = await db.raw(assigneesQuery, [taskId]);
    
    if (isCompletingTask && assignees && assignees.length > 0) {
      const assigneeIds = assignees.map(assignee => assignee.id);
      
      for (const assigneeId of assigneeIds) {
        try {
          await db.create('PointsTransaction', {
            id: uuidv4(),
            userId: assigneeId,
            points: 2,
            reason: 'Completed a task',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          const user = await db.findOne('User', { id: assigneeId });
          const newPoints = (user.points || 0) + 2;
          await db.update('User', assigneeId, {
            points: newPoints,
            updatedAt: new Date()
          });
          
          const newLevel = Math.floor(newPoints / 100) + 1;
          if (user.level !== newLevel) {
            await db.update('User', assigneeId, { 
              level: newLevel,
              updatedAt: new Date()
            });
          }
        } catch (err) {
          console.error(`Error awarding points to user ${assigneeId}:`, err);
        }
      }
    }
    
    const creator = await db.findOne('User', { id: task.createdBy }, ['id', 'name', 'email']);
    const status = await db.findOne('TaskStatus', { id: statusId });
    
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
};


export const startTimer = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    const task = await db.findOne('Task', { id: taskId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const isAssignee = await db.findOne('TaskAssignee', { taskId, userId });
    const isCreator = task.createdBy === userId;
    
    if (!isAssignee && !isCreator) {
      return res.status(403).json({ error: 'Not authorized to track time for this task' });
    }
    
    if (task.isTimerRunning) {
      return res.status(400).json({ error: 'Timer is already running for this task' });
    }
    
    const now = new Date();
    const updatedTask = await db.update('Task', taskId, {
      isTimerRunning: true,
      timerStartedAt: now,
      updatedAt: now
    });
    
    res.status(200).json({
      message: 'Timer started successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
};



export const getFreelanceTasks = async (req, res) => {
  try {
    const tasksQuery = `
      SELECT t.*, ts.id AS statusId, ts.name AS statusName, 
             u.id AS creatorId, u.name AS creatorName, u.email AS creatorEmail,
             s.id AS startupId, s.name AS startupName
      FROM Task t
      LEFT JOIN TaskStatus ts ON t.statusId = ts.id
      LEFT JOIN User u ON t.createdBy = u.id
      LEFT JOIN Startup s ON t.startupId = s.id
      WHERE t.isFreelance = 1 AND t.freelancerId IS NULL
    `;
    const tasks = await db.raw(tasksQuery);
    
    const updatedTasks = tasks.map(task => {
      let urgencyLevel = task.urgencyLevel;
      if (task.dueDate) {
        urgencyLevel = calculateUrgencyLevel(task.estimatedHours || 1, task.dueDate);
        
        if (urgencyLevel !== task.urgencyLevel) {
          db.update('Task', { id: task.id }, { 
            urgencyLevel,
            updatedAt: new Date()
          }).catch(err => console.error('Error updating task urgency:', err));
        }
      }
      
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        isFreelance: !!task.isFreelance,
        freelancerId: task.freelancerId,
        estimatedHours: task.estimatedHours || 0,
        hourlyRate: task.hourlyRate || 0,
        urgencyLevel: urgencyLevel,
        basePoints: task.basePoints || 0,
        totalPoints: task.totalPoints || 0,
        status: {
          id: task.statusId,
          name: task.statusName
        },
        startup: {
          id: task.startupId,
          name: task.startupName
        },
        createdBy: task.creatorId,
        creator: {
          id: task.creatorId,
          name: task.creatorName,
          email: task.creatorEmail
        },
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      };
    });
    
    res.json(updatedTasks);
  } catch (err) {
    console.error('Error fetching freelance tasks:', err);
    res.status(500).send('Server Error');
  }
};

export const acceptFreelanceTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    console.log(`Accepting freelance task ${taskId} for user ${userId}`);
    
    const task = await db.findOne('Task', { id: taskId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (!task.isFreelance) {
      return res.status(400).json({ message: 'This is not a freelance task' });
    }
    
    if (task.freelancerId) {
      return res.status(400).json({ message: 'This task has already been accepted by someone else' });
    }
    
    const now = new Date();
    await db.update('Task', taskId, { 
      freelancerId: userId,
      updatedAt: now
    });
    
    const updatedTask = await db.findOne('Task', { id: taskId });
    const status = await db.findOne('TaskStatus', { id: updatedTask.statusId });
    const creator = await db.findOne('User', { id: updatedTask.createdBy });
    const startup = await db.findOne('Startup', { id: updatedTask.startupId });
    
    const response = {
      ...updatedTask,
      isFreelance: !!updatedTask.isFreelance,
      status,
      startup,
      creator
    };
    
    res.json(response);
  } catch (err) {
    console.error('Error accepting freelance task:', err);
    res.status(500).json({ message: 'Server Error: Failed to accept task' });
  }
};

export const cancelFreelanceTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    console.log(`Attempting to cancel task ${taskId} for user ${userId}`);

    // Check if task exists and belongs to the user
    const task = await db.findOne('Task', { id: taskId });

    if (!task) {
      console.log(`Task ${taskId} not found`);
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.isFreelance) {
      console.log(`Task ${taskId} is not a freelance task`);
      return res.status(400).json({ message: 'This is not a freelance task' });
    }

    if (task.freelancerId != userId) {
      console.log(`Task ${taskId} is not assigned to user ${userId}`);
      return res.status(403).json({ message: 'You can only cancel tasks assigned to you' });
    }

    console.log(`Cancelling task ${taskId} - removing assignment from user ${userId}`);

    // Update the task to remove freelancer assignment
    await db.update('Task', taskId, { freelancerId: null, updatedAt: new Date() });

    console.log(`Task ${taskId} successfully unassigned from user ${userId}`);

    // Get the updated task
    const updatedTask = await db.findOne('Task', { id: taskId });
    const status = await db.findOne('TaskStatus', { id: updatedTask.statusId });
    const creator = await db.findOne('User', { id: updatedTask.createdBy });
    const startup = await db.findOne('Startup', { id: updatedTask.startupId });

    // Format response
    const response = {
      ...updatedTask,
      isFreelance: !!updatedTask.isFreelance,
      status,
      startup,
      creator
    };

    console.log(`Returning updated task data for ${taskId}`);
    res.json(response);
  } catch (err) {
    console.error('Error cancelling freelance task:', err);
    res.status(500).json({ message: 'Server Error: Failed to cancel task' });
  }
};

// New function to get freelance tasks assigned to the user
export const getMyFreelanceTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all freelance tasks assigned to this user
    const tasksQuery = `
      SELECT t.*, ts.id AS statusId, ts.name AS statusName, 
             u.id AS creatorId, u.name AS creatorName, u.email AS creatorEmail,
             s.id AS startupId, s.name AS startupName
      FROM Task t
      LEFT JOIN TaskStatus ts ON t.statusId = ts.id
      LEFT JOIN User u ON t.createdBy = u.id
      LEFT JOIN Startup s ON t.startupId = s.id
      WHERE t.isFreelance = 1 AND t.freelancerId = ?
    `;
    const tasks = await db.raw(tasksQuery, [userId]);

    // Update urgency levels based on current time
    const updatedTasks = tasks.map(task => {
      // Recalculate urgency level if due date exists
      let urgencyLevel = task.urgencyLevel;
      if (task.dueDate) {
        urgencyLevel = calculateUrgencyLevel(task.estimatedHours || 1, task.dueDate);

        // If urgency has changed, update it in the database (async)
        if (urgencyLevel !== task.urgencyLevel) {
          db.update('Task', { id: task.id }, { 
            urgencyLevel,
            updatedAt: new Date()
          }).catch(err => console.error('Error updating task urgency:', err));
        }
      }

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        isFreelance: !!task.isFreelance,
        freelancerId: task.freelancerId,
        estimatedHours: task.estimatedHours || 0,
        hourlyRate: task.hourlyRate || 0,
        urgencyLevel: urgencyLevel,
        basePoints: task.basePoints || 0,
        totalPoints: task.totalPoints || 0,
        status: {
          id: task.statusId,
          name: task.statusName
        },
        startup: {
          id: task.startupId,
          name: task.startupName
        },
        createdBy: task.creatorId,
        creator: {
          id: task.creatorId,
          name: task.creatorName,
          email: task.creatorEmail
        },
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      };
    });

    res.json(updatedTasks);
  } catch (err) {
    console.error('Error fetching my freelance tasks:', err);
    res.status(500).send('Server Error');
  }
};

// New function to stop the timer for a task
export const stopTimer = async (req, res) => {
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
    const timeLogId = uuidv4();
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
};

// New function to get time logs for a specific task
export const getTimeLogs = async (req, res) => {
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
};

// New function to delete a task
export const deleteTask = async (req, res) => {
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
    await db.deleteMany('TaskAssignee', { taskId });

    // Delete any time tracking logs
    await db.deleteMany('TimeTrackingLog', { taskId });

    // Delete the task
    await db.delete('Task', taskId);

    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// New function to update a task
export const updateTask = async (req, res) => {
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
          const assigneeUuid = uuidv4();
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
};