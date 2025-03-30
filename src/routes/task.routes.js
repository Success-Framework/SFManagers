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
      include: { startup: true }
    });
    
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    
    // Check if user is a member of the startup
    const isMember = await isStartupMember(userId, task.startupId);
    if (!isMember) {
      return res.status(403).json({ msg: 'Not authorized to update this task' });
    }
    
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

module.exports = router; 