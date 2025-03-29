const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create a join request
router.post('/', auth, async (req, res) => {
  try {
    const { roleId, message } = req.body;
    const userId = req.user.id;

    if (!roleId) {
      return res.status(400).json({ message: 'Role ID is required' });
    }

    // Get the role and check if it exists and is open
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { startup: true }
    });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (!role.isOpen) {
      return res.status(400).json({ message: 'This role is not open for applications' });
    }

    // Check if the user already has a pending request for this role
    const existingRequest = await prisma.joinRequest.findFirst({
      where: {
        userId,
        roleId,
        status: 'PENDING'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this role' });
    }

    // Check if the user is not the owner of the startup
    if (role.startup.ownerId === userId) {
      return res.status(400).json({ message: 'You cannot join your own startup' });
    }

    console.log('Creating join request with:', {
      userId,
      roleId,
      startupId: role.startup.id,
      receiverId: role.startup.ownerId,
      message: message || undefined
    });

    // Create the join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        userId,
        roleId,
        startupId: role.startup.id,
        receiverId: role.startup.ownerId,
        message: message || undefined,
        status: 'PENDING'
      }
    });

    res.status(201).json(joinRequest);
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ message: 'Error creating join request' });
  }
});

// Get all join requests for a startup (owner only)
router.get('/startup/:startupId', auth, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    // Check if the user is the startup owner
    const startup = await prisma.startup.findUnique({
      where: { id: startupId }
    });

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    if (startup.ownerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    // Get all join requests for the startup's roles
    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        role: {
          startupId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        role: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(joinRequests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ message: 'Error fetching join requests' });
  }
});

// Get current user's join requests
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const joinRequests = await prisma.joinRequest.findMany({
      where: {
        userId
      },
      include: {
        role: {
          include: {
            startup: {
              select: {
                id: true,
                name: true,
                stage: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(joinRequests);
  } catch (error) {
    console.error('Error fetching user join requests:', error);
    res.status(500).json({ message: 'Error fetching user join requests' });
  }
});

// Update join request status (accept/reject) - startup owner only
router.patch('/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (ACCEPTED or REJECTED) is required' });
    }

    // Get the join request with related data
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        role: {
          include: {
            startup: true
          }
        }
      }
    });

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Check if the user is the startup owner
    if (joinRequest.role.startup.ownerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    // Update the join request status
    const updatedRequest = await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status }
    });

    // If accepted, update the role to closed and create user role assignment
    if (status === 'ACCEPTED') {
      // First check if the role is still open
      const role = await prisma.role.findUnique({
        where: { id: joinRequest.roleId }
      });
      
      if (!role || !role.isOpen) {
        return res.status(400).json({ message: 'This role is no longer available' });
      }
      
      // Close the role
      await prisma.role.update({
        where: { id: joinRequest.roleId },
        data: { isOpen: false }
      });
      
      // Create a UserRole record to assign the user to this role
      try {
        await prisma.userRole.create({
          data: {
            userId: joinRequest.userId,
            roleId: joinRequest.roleId
          }
        });
      } catch (userRoleError) {
        console.error('Error creating user role assignment:', userRoleError);
        // Don't fail the whole request if this secondary operation fails
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating join request:', error);
    res.status(500).json({ message: 'Error updating join request' });
  }
});

// New PUT route for updating status - Supports the same functionality but with PUT method and different URL
router.put('/:requestId/status', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    let { status } = req.body;
    const userId = req.user.id;

    // Convert APPROVED to ACCEPTED if needed (for compatibility between frontend/backend)
    if (status === 'APPROVED') {
      status = 'ACCEPTED';
    }

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (ACCEPTED or REJECTED) is required' });
    }

    // Get the join request with related data
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        role: {
          include: {
            startup: true
          }
        }
      }
    });

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Check if the user is the startup owner
    if (joinRequest.role.startup.ownerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    // Update the join request status
    const updatedRequest = await prisma.joinRequest.update({
      where: { id: requestId },
      data: { status }
    });

    // If accepted, update the role to closed and create user role assignment
    if (status === 'ACCEPTED') {
      // First check if the role is still open
      const role = await prisma.role.findUnique({
        where: { id: joinRequest.roleId }
      });
      
      if (!role || !role.isOpen) {
        return res.status(400).json({ message: 'This role is no longer available' });
      }
      
      // Close the role
      await prisma.role.update({
        where: { id: joinRequest.roleId },
        data: { isOpen: false }
      });
      
      // Create a UserRole record to assign the user to this role
      try {
        await prisma.userRole.create({
          data: {
            userId: joinRequest.userId,
            roleId: joinRequest.roleId
          }
        });
      } catch (userRoleError) {
        console.error('Error creating user role assignment:', userRoleError);
        // Don't fail the whole request if this secondary operation fails
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating join request:', error);
    res.status(500).json({ message: 'Error updating join request' });
  }
});

// Delete a join request (user can only delete their own requests)
router.delete('/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        role: {
          include: {
            startup: true
          }
        }
      }
    });

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Only the request creator or startup owner can delete it
    if (joinRequest.userId !== userId && joinRequest.role.startup.ownerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You cannot delete this request' });
    }

    await prisma.joinRequest.delete({
      where: { id: requestId }
    });

    res.json({ message: 'Join request deleted successfully' });
  } catch (error) {
    console.error('Error deleting join request:', error);
    res.status(500).json({ message: 'Error deleting join request' });
  }
});

module.exports = router; 