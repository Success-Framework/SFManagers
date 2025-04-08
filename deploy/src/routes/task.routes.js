const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to check if a user is a member of a startup
async function isStartupMember(userId, startupId) {
  // Check if user is the startup owner
  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
  });
  
  if (startup.ownerId === userId) {
    return true;
  }
  
  // Check if user has a role in the startup
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: userId,
      role: {
        startupId: startupId
      }
    }
  });
  
  return !!userRole;
}

// Initialize task statuses for a startup if they don't exist
async function initializeTaskStatuses(startupId) {
  const existingStatuses = await prisma.taskStatus.findMany({
    where: { startupId }
  });
  
  if (existingStatuses.length === 0) {
    const defaultStatuses = ['To Do', 'In Progress', 'Done'];
    
    for (const status of defaultStatuses) {
      await prisma.taskStatus.create({
        data: {
          name: status,
          startup: {
            connect: { id: startupId }
          }
        }
      });
    }
  }
}

// Get task statuses for a startup
router.get('/statuses/:startupId', auth, async (req, res) => {
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
    const statuses = await prisma.taskStatus.findMany({
      where: { startupId }
    });
    
    res.json(statuses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all tasks for a specific startup
router.get('/startup/:startupId', auth, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to access this startup' });
    }
    
    // Get all tasks for the startup
    const tasks = await prisma.task.findMany({
      where: { startupId },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Transform the response to make it easier to work with on the frontend
    const transformedTasks = tasks.map(task => ({
      ...task,
      assignees: task.assignees.map(assignee => assignee.user)
    }));
    
    res.json(transformedTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, statusId, assigneeIds, startupId } = req.body;
    const userId = req.user.id;
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to create tasks for this startup' });
    }
    
    // Validate data
    if (!title || !statusId || !startupId) {
      return res.status(400).json({ msg: 'Title, status and startup are required' });
    }
    
    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: {
          connect: { id: statusId }
        },
        startup: {
          connect: { id: startupId }
        },
        creator: {
          connect: { id: userId }
        },
        // Connect assignees if provided
        assignees: assigneeIds && assigneeIds.length > 0 ? {
          create: assigneeIds.map(assigneeId => ({
            user: {
          connect: { id: assigneeId }
            }
          }))
        } : undefined
      },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Transform the response
    const transformedTask = {
      ...task,
      assignees: task.assignees.map(assignee => assignee.user)
    };
    
    res.json(transformedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update task status via drag and drop
router.patch('/:taskId/status', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { statusId } = req.body;
    const userId = req.user.id;
    
    // Validate data
    if (!statusId) {
      return res.status(400).json({ msg: 'Status ID is required' });
    }
    
    // Get the task to verify permissions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { 
        startup: true,
        status: true,
        assignees: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, task.startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }
    
    // Get the new status
    const newStatus = await prisma.taskStatus.findUnique({
      where: { id: statusId }
    });
    
    if (!newStatus) {
      return res.status(404).json({ msg: 'Status not found' });
    }
    
    // Check if the task is being moved to 'Done' status
    const isCompletingTask = newStatus.name === 'Done' && task.status.name !== 'Done';
    
    // Update the task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: {
          connect: { id: statusId }
        }
      },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // If the task is being completed, award points to assignees
    if (isCompletingTask) {
      const assigneeIds = task.assignees.map(assignee => assignee.user.id);
      
      // Award 2 points to each assignee
      for (const assigneeId of assigneeIds) {
        try {
          // Record the points transaction
          await prisma.pointsTransaction.create({
            data: {
              userId: assigneeId,
              amount: 2,
              reason: 'Completed a task',
              meta: JSON.stringify({
                taskId: task.id,
                taskTitle: task.title,
                startupId: task.startupId,
                startupName: task.startup.name
              })
            }
          });
          
          // Update user's points
          const user = await prisma.user.update({
            where: { id: assigneeId },
            data: {
              points: {
                increment: 2
              }
            }
          });
          
          // Update user's level if needed
          const newLevel = Math.floor(user.points / 100) + 1;
          if (user.level !== newLevel) {
            await prisma.user.update({
              where: { id: assigneeId },
              data: { level: newLevel }
            });
          }
        } catch (err) {
          console.error(`Error awarding points to user ${assigneeId}:`, err);
          // Don't fail the request if points awarding fails
        }
      }
    }
    
    // Transform the response
    const transformedTask = {
      ...updatedTask,
      assignees: updatedTask.assignees.map(assignee => assignee.user)
    };
    
    res.json(transformedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a task
router.put('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, priority, dueDate, statusId, assigneeIds } = req.body;
    const userId = req.user.id;
    
    // Get the task to verify ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { 
        startup: true,
        assignees: true
      }
    });
    
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
      await prisma.taskAssignee.deleteMany({
        where: { taskId }
      });
      
      // Then add the new assignees if any are provided
      if (assigneeIds && assigneeIds.length > 0) {
        await Promise.all(assigneeIds.map(assigneeId => 
          prisma.taskAssignee.create({
            data: {
              task: { connect: { id: taskId } },
              user: { connect: { id: assigneeId } }
            }
          })
        ));
      }
    }
    
    // Update the other task fields
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        priority: priority !== undefined ? priority : task.priority,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
        status: statusId ? {
          connect: { id: statusId }
        } : undefined
      },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Transform the response
    const transformedTask = {
      ...updatedTask,
      assignees: updatedTask.assignees.map(assignee => assignee.user)
    };
    
    res.json(transformedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a task
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // Get the task to verify ownership
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { startup: true }
    });
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user is the startup owner or the task creator
    const isOwner = task.startup.ownerId === userId;
    const isCreator = task.createdBy === userId;
    
    if (!isOwner && !isCreator) {
      return res.status(403).json({ msg: 'Not authorized to delete this task' });
    }
    
    // Delete the task - this will automatically delete all related TaskAssignee records
    // due to the onDelete: Cascade setting in the schema
    await prisma.task.delete({
      where: { id: taskId }
    });
    
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all tasks assigned to the current user
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all tasks where the user is an assignee
    const tasks = await prisma.task.findMany({
      where: {
        assignees: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        status: true,
        startup: {
          select: {
            id: true,
            name: true
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });
    
    // Transform the tasks to match the expected format
    const transformedTasks = tasks.map(task => ({
      ...task,
      assignees: task.assignees.map(assignee => assignee.user)
    }));
    
    res.json(transformedTasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Start timer for a task
router.post('/:taskId/timer/start', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
        startup: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has permission to track time for this task
    const isAssignee = task.assignees.some(assignee => assignee.userId === userId);
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
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        isTimerRunning: true,
        timerStartedAt: now
      },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Transform the response
    const transformedTask = {
      ...updatedTask,
      assignees: updatedTask.assignees.map(assignee => assignee.user)
    };
    
    return res.status(200).json({
      message: 'Timer started successfully',
      task: transformedTask
    });
  } catch (error) {
    console.error('Error starting timer:', error);
    return res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Pause timer for a task
router.post('/:taskId/timer/pause', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { note } = req.body;
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
        startup: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has permission
    const isAssignee = task.assignees.some(assignee => assignee.userId === userId);
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
    const timeTrackingLog = await prisma.timeTrackingLog.create({
      data: {
        task: { connect: { id: taskId } },
        user: { connect: { id: userId } },
        startTime: task.timerStartedAt,
        endTime: now,
        duration: sessionDuration,
        note: note || ''
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Update task with new total time and reset timer
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        totalTimeSpent: (task.totalTimeSpent || 0) + sessionDuration,
        isTimerRunning: false,
        timerStartedAt: null
      },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Transform the response
    const transformedTask = {
      ...updatedTask,
      assignees: updatedTask.assignees.map(assignee => assignee.user)
    };
    
    return res.status(200).json({
      message: 'Timer paused successfully',
      task: transformedTask,
      timeLog: timeTrackingLog
    });
  } catch (error) {
    console.error('Error pausing timer:', error);
    return res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// Get time logs for a task
router.get('/:taskId/time-logs', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: true,
        startup: true
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if user has permission
    const isAssignee = task.assignees.some(assignee => assignee.userId === userId);
    const isCreator = task.createdBy === userId;
    const isMember = await isStartupMember(userId, task.startupId);
    
    if (!isAssignee && !isCreator && !isMember) {
      return res.status(403).json({ error: 'Not authorized to view time logs for this task' });
    }
    
    // Get time logs
    const timeLogs = await prisma.timeTrackingLog.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    });
    
    return res.status(200).json(timeLogs);
  } catch (error) {
    console.error('Error getting time logs:', error);
    return res.status(500).json({ error: 'Failed to get time logs' });
  }
});

// Stop timer and save time
router.post('/:taskId/timer/stop', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        startup: true,
        assignees: {
          include: {
            user: true
          }
        }
      }
    });

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
    const timeLog = await prisma.timeTrackingLog.create({
      data: {
        taskId,
        userId,
        startTime: task.timerStartedAt,
        endTime: now,
        duration: sessionDuration,
        note: req.body.note || ""
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update task with new total time and stop timer
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        totalTimeSpent,
        isTimerRunning: false,
        timerStartedAt: null
      },
      include: {
        status: true,
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Transform the response
    const transformedTask = {
      ...updatedTask,
      assignees: updatedTask.assignees.map(assignee => assignee.user)
    };

    return res.status(200).json({
      message: 'Timer stopped successfully',
      task: transformedTask,
      timeLog
    });
  } catch (err) {
    console.error('Error stopping timer:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 