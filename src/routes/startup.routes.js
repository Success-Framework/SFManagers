const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create a new startup (authenticated)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, details, stage, roles } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!name || !details || !stage || !roles || !Array.isArray(roles) || roles.length === 0 || roles.length > 5) {
      return res.status(400).json({ 
        error: 'Invalid input. Please provide name, details, stage, and between 1-5 roles.' 
      });
    }
    
    // Create startup with roles
    const startup = await prisma.startup.create({
      data: {
        name,
        details,
        stage,
        owner: {
          connect: { id: userId }
        },
        roles: {
          create: roles.map(role => ({ 
            title: role,
            isOpen: true
          }))
        }
      },
      include: {
        roles: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return res.status(201).json(startup);
  } catch (error) {
    console.error('Error creating startup:', error);
    return res.status(500).json({ error: 'Failed to create startup' });
  }
});

// Get all startups (public)
router.get('/', async (_req, res) => {
  try {
    const startups = await prisma.startup.findMany({
      include: {
        roles: true,
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    return res.json(startups);
  } catch (error) {
    console.error('Error fetching startups:', error);
    return res.status(500).json({ error: 'Failed to fetch startups' });
  }
});

// Get startups owned by the authenticated user
router.get('/my-startups', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const startups = await prisma.startup.findMany({
      where: {
        ownerId: userId
      },
      include: {
        roles: {
          include: {
            assignedUsers: {
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
            requests: {
              where: {
                status: 'PENDING'
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
            }
          }
        }
      }
    });
    
    return res.json(startups);
  } catch (error) {
    console.error('Error fetching user startups:', error);
    return res.status(500).json({ error: 'Failed to fetch user startups' });
  }
});

// Get a specific startup by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const startup = await prisma.startup.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            assignedUsers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    // Transform the data to include assignedUser directly on roles
    const transformedStartup = {
      ...startup,
      roles: startup.roles.map(role => {
        // Get the first assigned user if any
        const assignedUser = role.assignedUsers && role.assignedUsers.length > 0
          ? role.assignedUsers[0].user
          : undefined;
        
        return {
          ...role,
          assignedUser
        };
      })
    };
    
    return res.json(transformedStartup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    return res.status(500).json({ error: 'Failed to fetch startup' });
  }
});

// Update a startup (authenticated, owner only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, details, stage } = req.body;
    const userId = req.user.id;
    
    // Check if startup exists and user is the owner
    const startup = await prisma.startup.findUnique({
      where: { id }
    });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this startup' });
    }
    
    // Update startup
    const updatedStartup = await prisma.startup.update({
      where: { id },
      data: {
        name: name || undefined,
        details: details || undefined,
        stage: stage || undefined
      },
      include: {
        roles: true
      }
    });
    
    return res.json(updatedStartup);
  } catch (error) {
    console.error('Error updating startup:', error);
    return res.status(500).json({ error: 'Failed to update startup' });
  }
});

// Get members of a startup
router.get('/:startupId/members', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId }
    });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Check if user is a member or owner of the startup
    const isOwner = startup.ownerId === userId;
    
    if (!isOwner) {
      const isMember = await prisma.userRole.findFirst({
        where: {
          userId,
          role: {
            startupId
          }
        }
      });
      
      if (!isMember) {
        return res.status(403).json({ msg: 'Not authorized to view this startup' });
      }
    }
    
    // Get all members (owner + people with accepted roles)
    const owner = await prisma.user.findUnique({
      where: { id: startup.ownerId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    const roleMembers = await prisma.user.findMany({
      where: {
        joinedRoles: {
          some: {
            role: {
              startupId
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    // Combine owner and members, removing duplicates
    const members = [owner, ...roleMembers].filter((member, index, self) => 
      index === self.findIndex(m => m.id === member.id)
    );
    
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Accept a join request
router.post('/:startupId/requests/:requestId/accept', authMiddleware, async (req, res) => {
  try {
    const { startupId, requestId } = req.params;
    const { role } = req.body; // Get role from request body
    const userId = req.user.id;
    
    // Check if the user is the owner of the startup
    const startup = await prisma.startup.findUnique({
      where: { id: startupId }
    });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    if (startup.ownerId !== userId) {
      return res.status(403).json({ msg: 'Not authorized to accept requests for this startup' });
    }
    
    // Find the request
    const request = await prisma.startupRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }
    
    if (request.startupId !== startupId) {
      return res.status(400).json({ msg: 'Request does not belong to this startup' });
    }
    
    // Update the request status to accepted
    await prisma.startupRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });
    
    // Add the user to the startup members with role
    await prisma.startupMember.create({
      data: {
        startup: {
          connect: { id: startupId }
        },
        user: {
          connect: { id: request.userId }
        },
        role: role || 'Employee - Marketing and Sales' // Use provided role or default
      }
    });
    
    res.json({ msg: 'Request accepted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 