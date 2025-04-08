const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Create a new startup (authenticated)
router.post('/', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, location, industry, mission, vision } = req.body;
    let roles = [];
    
    // Parse roles from string (FormData converts arrays to strings)
    if (req.body.roles) {
      try {
        roles = JSON.parse(req.body.roles);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid roles format' });
      }
    }
    
    const userId = req.user.id;
    
    // Validate input
    if (!name || !description || !roles || !Array.isArray(roles) || roles.length === 0 || roles.length > 5) {
      return res.status(400).json({ 
        error: 'Invalid input. Please provide name, description, and between 1-5 roles.' 
      });
    }
    
    // Check if each role has title and roleType
    for (const role of roles) {
      if (!role.title || !role.roleType) {
        return res.status(400).json({
          error: 'Each role must have a title and role type.'
        });
      }
    }
    
    // Get file paths if uploaded
    let logoPath = null;
    let bannerPath = null;
    
    if (req.files) {
      if (req.files.logo && req.files.logo.length > 0) {
        logoPath = `/uploads/${req.files.logo[0].filename}`;
      }
      
      if (req.files.banner && req.files.banner.length > 0) {
        bannerPath = `/uploads/${req.files.banner[0].filename}`;
      }
    }
    
    // Create startup with roles
    const startup = await prisma.startup.create({
      data: {
        name,
        details: description,
        stage: 'Idea', // Default stage
        logo: logoPath,
        banner: bannerPath,
        location: location || undefined,
        industry: industry || undefined,
        owner: {
          connect: { id: userId }
        },
        roles: {
          create: roles.map(role => ({ 
            title: role.title,
            roleType: role.roleType,
            isPaid: role.isPaid || false,
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
            users: {
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
      where: {
        id: id
      },
      include: {
        roles: {
          include: {
            users: {
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
        const assignedUser = role.users && role.users.length > 0
          ? role.users[0].user
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
router.put('/:id', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, details, stage, website, location, industry, logoUrl, bannerUrl } = req.body;
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
    
    // Prepare update data
    const updateData = {
      name: name || undefined,
      details: details || undefined,
      stage: stage || undefined,
      website: website || undefined,
      location: location || undefined,
      industry: industry || undefined
    };
    
    // Handle logo file upload
    if (req.files && req.files.logo && req.files.logo.length > 0) {
      updateData.logo = `/uploads/${req.files.logo[0].filename}`;
      
      // Delete old logo file if exists and is not a URL
      if (startup.logo && startup.logo.startsWith('/uploads/')) {
        const oldLogoPath = path.join(__dirname, '..', startup.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
    } else if (logoUrl) {
      // If no new file but URL provided, use URL
      updateData.logo = logoUrl;
    }
    
    // Handle banner file upload
    if (req.files && req.files.banner && req.files.banner.length > 0) {
      updateData.banner = `/uploads/${req.files.banner[0].filename}`;
      
      // Delete old banner file if exists and is not a URL
      if (startup.banner && startup.banner.startsWith('/uploads/')) {
        const oldBannerPath = path.join(__dirname, '..', startup.banner);
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath);
        }
      }
    } else if (bannerUrl) {
      // If no new file but URL provided, use URL
      updateData.banner = bannerUrl;
    }
    
    // Update startup
    const updatedStartup = await prisma.startup.update({
      where: { id },
      data: updateData,
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

// Get members of a startup WITH their roles
router.get('/:startupId/members-with-roles', authMiddleware, async (req, res) => {
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
    
    // Check if user is a member, admin, or owner of the startup
    const isOwner = startup.ownerId === userId;
    
    if (!isOwner) {
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId,
          role: {
            startupId
          }
        },
        include: {
          role: true
        }
      });
      
      // Only allow owners or admins to see roles
      if (!userRole || !userRole.role.roleType.toLowerCase().includes('admin')) {
        return res.status(403).json({ msg: 'Not authorized to view roles for this startup' });
      }
    }
    
    // Get all members with their roles
    const members = await prisma.user.findMany({
      where: {
        OR: [
          { id: startup.ownerId },
          {
            joinedRoles: {
              some: {
                role: {
                  startupId
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        joinedRoles: {
          where: {
            role: {
              startupId
            }
          },
          include: {
            role: true
          }
        }
      }
    });
    
    // Format the response to include role information
    const formattedMembers = members.map(member => {
      // The owner might not have a specific role, so add a special "Founder" role
      if (member.id === startup.ownerId) {
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.joinedRoles.length > 0 ? 
            {
              id: member.joinedRoles[0].role.id,
              title: member.joinedRoles[0].role.title,
              roleType: member.joinedRoles[0].role.roleType
            } : 
            {
              id: 'owner',
              title: 'Founder',
              roleType: 'Admin'
            }
        };
      } else {
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.joinedRoles.length > 0 ? 
            {
              id: member.joinedRoles[0].role.id,
              title: member.joinedRoles[0].role.title,
              roleType: member.joinedRoles[0].role.roleType
            } : 
            undefined
        };
      }
    });
    
    res.json(formattedMembers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a user's role in a startup
router.put('/:startupId/users/:userId/role', authMiddleware, async (req, res) => {
  try {
    const { startupId, userId } = req.params;
    const { roleId } = req.body;
    const requestingUserId = req.user.id;
    
    if (!roleId) {
      return res.status(400).json({ msg: 'Role ID is required' });
    }
    
    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId }
    });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Check if user is the owner or an admin
    const isOwner = startup.ownerId === requestingUserId;
    
    if (!isOwner) {
      const requestingUserRole = await prisma.userRole.findFirst({
        where: {
          userId: requestingUserId,
          role: {
            startupId
          }
        },
        include: {
          role: true
        }
      });
      
      if (!requestingUserRole || !requestingUserRole.role.roleType.toLowerCase().includes('admin')) {
        return res.status(403).json({ msg: 'Not authorized to update roles for this startup' });
      }
    }
    
    // Check if the role exists and belongs to this startup
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        startupId
      }
    });
    
    if (!role) {
      return res.status(404).json({ msg: 'Role not found in this startup' });
    }
    
    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Special check - don't allow changing the role of the owner
    if (userId === startup.ownerId) {
      return res.status(403).json({ msg: 'Cannot change the role of the startup owner' });
    }
    
    // Check if the user already has a role in this startup
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          startupId
        }
      }
    });
    
    if (existingUserRole) {
      // Update the existing user role
      await prisma.userRole.update({
        where: {
          id: existingUserRole.id
        },
        data: {
          roleId
        }
      });
    } else {
      // Create a new user role
      await prisma.userRole.create({
        data: {
          userId,
          roleId,
          startupId
        }
      });
    }
    
    res.json({ msg: 'User role updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add new roles to a startup (authenticated, owner only)
router.post('/:id/roles', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input. Please provide at least one role.' 
      });
    }
    
    // Check if each role has title and roleType
    for (const role of roles) {
      if (!role.title || !role.roleType) {
        return res.status(400).json({
          error: 'Each role must have a title and role type.'
        });
      }
    }
    
    // Check if startup exists and user is the owner
    const startup = await prisma.startup.findUnique({
      where: { id }
    });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to add roles to this startup' });
    }
    
    // Create the new roles
    const createdRoles = await Promise.all(
      roles.map(role => 
        prisma.role.create({
          data: {
            title: role.title,
            roleType: role.roleType,
            isOpen: role.isOpen !== undefined ? role.isOpen : true,
            startup: {
              connect: { id }
            }
          }
        })
      )
    );
    
    // Get the updated startup with all roles
    const updatedStartup = await prisma.startup.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            users: {
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
    
    // Transform the data to include assignedUser directly on roles
    const transformedStartup = {
      ...updatedStartup,
      roles: updatedStartup.roles.map(role => {
        // Get the first assigned user if any
        const assignedUser = role.users && role.users.length > 0
          ? role.users[0].user
          : undefined;
        
        return {
          ...role,
          assignedUser
        };
      })
    };
    
    return res.status(201).json({
      message: 'Roles added successfully',
      startup: transformedStartup,
      addedRoles: createdRoles
    });
  } catch (error) {
    console.error('Error adding roles to startup:', error);
    return res.status(500).json({ error: 'Failed to add roles to startup' });
  }
});

// Edit a role (authenticated, owner only)
router.put('/roles/:roleId', authMiddleware, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { title, roleType, isOpen } = req.body;
    const userId = req.user.id;
    
    // Find the role and check if it exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        startup: true
      }
    });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if the user is the startup owner
    if (role.startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this role' });
    }
    
    // Update the role
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        title: title || undefined,
        roleType: roleType || undefined,
        isOpen: isOpen !== undefined ? isOpen : undefined
      },
      include: {
        users: {
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
        startup: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Transform the response to include assigned user
    const assignedUser = updatedRole.users && updatedRole.users.length > 0
      ? updatedRole.users[0].user
      : undefined;
      
    const transformedRole = {
      ...updatedRole,
      assignedUser
    };
    
    return res.json({
      message: 'Role updated successfully',
      role: transformedRole
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete a role (authenticated, owner only)
router.delete('/roles/:roleId', authMiddleware, async (req, res) => {
  try {
    const { roleId } = req.params;
    const userId = req.user.id;
    
    // Find the role and check if it exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        startup: true,
        users: true
      }
    });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if the user is the startup owner
    if (role.startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this role' });
    }
    
    // Check if the role has assigned users
    if (role.users && role.users.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete a role with assigned users. Please remove the users first.' 
      });
    }
    
    // Delete any pending join requests for this role
    await prisma.joinRequest.deleteMany({
      where: { roleId }
    });
    
    // Delete the role
    await prisma.role.delete({
      where: { id: roleId }
    });
    
    return res.json({
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Get all roles for a startup
router.get('/:startupId/roles', authMiddleware, async (req, res) => {
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
    
    // Check if user is a member, admin, or owner of the startup
    const isOwner = startup.ownerId === userId;
    
    if (!isOwner) {
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId,
          role: {
            startupId
          }
        },
        include: {
          role: true
        }
      });
      
      // Only allow owners or admins to see roles
      if (!userRole || !userRole.role.roleType.toLowerCase().includes('admin')) {
        return res.status(403).json({ msg: 'Not authorized to view roles for this startup' });
      }
    }
    
    // Get all roles for this startup
    const roles = await prisma.role.findMany({
      where: {
        startupId
      },
      select: {
        id: true,
        title: true,
        roleType: true,
        isOpen: true,
        isPaid: true
      }
    });
    
    res.json(roles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 