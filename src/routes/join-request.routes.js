const express = require('express');
// const prisma = require('../prisma').default; // Remove prisma import
const { db } = require('../database'); // Add db adapter
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Create a join request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { roleId, message } = req.body;
    const userId = req.user.id;

    if (!roleId) {
      return res.status(400).json({ message: 'Role ID is required' });
    }

    // Get the role and check if it exists and is open
    const role = await db.findOne('roles', { id: roleId });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (!role.isOpen) {
      return res.status(400).json({ message: 'This role is not open for applications' });
    }

    // Get the startup info
    const startup = await db.findOne('startups', { id: role.startupId });
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    // Check if the user already has a pending request for this role
    const existingRequestQuery = `
      SELECT * FROM join_requests 
      WHERE userId = ? AND roleId = ? AND status = 'PENDING'
    `;
    const existingRequests = await db.raw(existingRequestQuery, [userId, roleId]);
    if (existingRequests && existingRequests.length > 0) {
      return res.status(400).json({ message: 'You already have a pending request for this role' });
    }

    // Check if the user is not the owner of the startup
    if (startup.ownerId === userId) {
      return res.status(400).json({ message: 'You cannot join your own startup' });
    }

    // Get user for notification
    const user = await db.findOne('users', { id: userId });

    console.log('Creating join request with:', {
      userId,
      roleId,
      startupId: startup.id,
      message: message || undefined
    });

    // Create the join request
    const joinRequestId = uuidv4();
    const joinRequest = await db.create('join_requests', {
      id: joinRequestId,
        userId,
        roleId,
      startupId: startup.id,
      message: message || null,
      status: 'PENDING',
      receiverId: startup.ownerId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create a notification for the startup owner
    try {
      const notificationId = uuidv4();
      await db.create('notifications', {
        id: notificationId,
        userId: startup.ownerId,
          title: 'New Join Request',
        message: `${user.name} wants to join your startup as ${role.title}`,
          type: 'INFO',
          isRead: false,
          data: JSON.stringify({
          startupId: startup.id,
            roleId: roleId,
          requestId: joinRequestId,
            userId: userId
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Created notification for startup owner ${startup.ownerId} about new join request`);
    } catch (notifError) {
      console.error('Error creating owner notification:', notifError);
      // Continue even if notification creation fails
    }

    // Get complete join request info
    const completeJoinRequest = {
      ...joinRequest,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      role: {
        ...role,
        startup
      }
    };

    res.status(201).json(completeJoinRequest);
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ message: 'Error creating join request' });
  }
});

// Get all join requests for a startup (owner only)
router.get('/startup/:startupId', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    // Check if the user is the startup owner
    const startup = await db.findOne('startups', { id: startupId });

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    if (startup.ownerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    // Get all join requests for the startup's roles
    const joinRequestsQuery = `
      SELECT jr.*, u.id as userId, u.name as userName, u.email as userEmail, 
             r.id as roleId, r.title as roleTitle, r.roleType as roleType 
      FROM join_requests jr
      JOIN users u ON jr.userId = u.id
      JOIN roles r ON jr.roleId = r.id
      WHERE jr.startupId = ?
      ORDER BY jr.createdAt DESC
    `;
    const joinRequestsData = await db.raw(joinRequestsQuery, [startupId]);
    
    // Transform the data to match the expected format
    const joinRequests = joinRequestsData.map(jr => ({
      id: jr.id,
      userId: jr.userId,
      roleId: jr.roleId,
      startupId: jr.startupId,
      message: jr.message,
      status: jr.status,
      createdAt: jr.createdAt,
      updatedAt: jr.updatedAt,
        user: {
        id: jr.userId,
        name: jr.userName,
        email: jr.userEmail
      },
      role: {
        id: jr.roleId,
        title: jr.roleTitle,
        roleType: jr.roleType
      }
    }));

    res.json(joinRequests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ message: 'Error fetching join requests' });
  }
});

// Get current user's join requests
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get join requests with role and startup info
    const joinRequestsQuery = `
      SELECT jr.*, r.id as roleId, r.title as roleTitle, r.roleType as roleType,
             s.id as startupId, s.name as startupName, s.stage as startupStage
      FROM join_requests jr
      JOIN roles r ON jr.roleId = r.id
      JOIN startups s ON r.startupId = s.id
      WHERE jr.userId = ?
      ORDER BY jr.createdAt DESC
    `;
    const joinRequestsData = await db.raw(joinRequestsQuery, [userId]);

    // Transform to match expected format
    const joinRequests = joinRequestsData.map(jr => ({
      id: jr.id,
      userId: jr.userId,
      roleId: jr.roleId,
      startupId: jr.startupId, 
      status: jr.status,
      message: jr.message,
      createdAt: jr.createdAt,
      updatedAt: jr.updatedAt,
        role: {
        id: jr.roleId,
        title: jr.roleTitle,
        roleType: jr.roleType,
            startup: {
          id: jr.startupId,
          name: jr.startupName,
          stage: jr.startupStage
        }
      }
    }));

    res.json(joinRequests);
  } catch (error) {
    console.error('Error fetching user join requests:', error);
    res.status(500).json({ message: 'Error fetching user join requests' });
  }
});

// Update join request status (accept/reject) - startup owner only
router.patch('/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (ACCEPTED or REJECTED) is required' });
    }

    // Get the join request with related data
    const joinRequestQuery = `
      SELECT jr.*, r.id as roleId, r.title as roleTitle, r.isOpen as roleIsOpen,
             s.id as startupId, s.name as startupName, s.ownerId as startupOwnerId
      FROM join_requests jr
      JOIN roles r ON jr.roleId = r.id
      JOIN startups s ON r.startupId = s.id
      WHERE jr.id = ?
    `;
    const joinRequestsData = await db.raw(joinRequestQuery, [requestId]);
    
    if (!joinRequestsData || joinRequestsData.length === 0) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    
    const joinRequest = joinRequestsData[0];

    // Check if the user is the startup owner
    if (joinRequest.startupOwnerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    // Update the join request status
    const updatedRequest = await db.update('join_requests', requestId, { 
      status, 
      updatedAt: new Date()
    });
    
    // Get user data for notification
    const requestUser = await db.findOne('users', { id: joinRequest.userId });

    // Create notification for the user who made the request
    try {
      const notificationId = uuidv4();
      await db.create('notifications', {
        id: notificationId,
          userId: joinRequest.userId,
          title: `Join Request ${status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
          message: status === 'ACCEPTED' 
          ? `Your request to join ${joinRequest.startupName} as ${joinRequest.roleTitle} has been accepted!` 
          : `Your request to join ${joinRequest.startupName} as ${joinRequest.roleTitle} has been rejected.`,
          type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
          isRead: false,
          data: JSON.stringify({
          startupId: joinRequest.startupId,
            roleId: joinRequest.roleId,
            requestId: joinRequest.id
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Created notification for user ${joinRequest.userId} about request ${status}`);
    } catch (notifError) {
      console.error('Error creating user notification:', notifError);
      // Continue even if notification creation fails
    }

    // If accepted, update the role to closed and create user role assignment
    if (status === 'ACCEPTED') {
      // First check if the role is still open
      const role = await db.findOne('roles', { id: joinRequest.roleId });
      
      if (!role || !role.isOpen) {
        return res.status(400).json({ message: 'This role is no longer available' });
      }
      
      // Close the role
      await db.update('roles', joinRequest.roleId, { 
        isOpen: false,
        updatedAt: new Date()
      });
      
      // Create a UserRole record to assign the user to this role
      try {
        // First check if a UserRole already exists
        const existingRoleQuery = `
          SELECT * FROM user_roles 
          WHERE userId = ? AND roleId = ?
        `;
        const existingRoles = await db.raw(existingRoleQuery, [joinRequest.userId, joinRequest.roleId]);

        if (existingRoles && existingRoles.length > 0) {
          console.log('UserRole already exists:', existingRoles[0]);
          return res.status(400).json({ message: 'User is already assigned to this role' });
        }

        // Create the UserRole record
        const userRoleId = uuidv4();
        const userRole = await db.create('user_roles', {
          id: userRoleId,
            userId: joinRequest.userId,
            roleId: joinRequest.roleId,
          startupId: joinRequest.startupId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log('Created UserRole:', userRole);
        
        // Determine points to award based on role type
        let pointsToAward = 10; // Default points for regular employees
        let reason = 'Joined a startup as a team member';
        
        // Award different points based on role title or type
        const roleTitle = joinRequest.roleTitle.toLowerCase();
        const roleType = joinRequest.roleType?.toLowerCase() || '';
        
        if (roleTitle.includes('admin') || roleTitle.includes('founder') || roleTitle.includes('co-founder')) {
          pointsToAward = 50;
          reason = 'Joined a startup as an admin';
        } else if (roleTitle.includes('manager') || roleTitle.includes('lead') || roleTitle.includes('head')) {
          pointsToAward = 20;
          reason = 'Joined a startup as a manager';
        }
        
        // Record the points transaction
        const transactionId = uuidv4();
        await db.create('points_transactions', {
          id: transactionId,
            userId: joinRequest.userId,
            amount: pointsToAward,
            reason,
            meta: JSON.stringify({
            startupId: joinRequest.startupId,
            startupName: joinRequest.startupName,
              roleId: joinRequest.roleId,
            roleTitle: joinRequest.roleTitle
          }),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Update user's points
        const user = await db.findOne('users', { id: joinRequest.userId });
        const newPoints = (user.points || 0) + pointsToAward;
        await db.update('users', joinRequest.userId, {
          points: newPoints,
          updatedAt: new Date()
        });
        
        // Calculate and update level if needed
        const newLevel = Math.floor(newPoints / 100) + 1;
        if (user.level !== newLevel) {
          await db.update('users', joinRequest.userId, { 
            level: newLevel,
            updatedAt: new Date()
          });
        }
      } catch (userRoleError) {
        console.error('Error creating user role assignment:', userRoleError);
        // Don't fail the whole request if this secondary operation fails
      }
    }

    // Get complete updated data for response
    const completeJoinRequest = {
      ...updatedRequest,
      role: {
        id: joinRequest.roleId,
        title: joinRequest.roleTitle,
        startup: {
          id: joinRequest.startupId,
          name: joinRequest.startupName
        }
      },
      user: requestUser
    };

    res.json(completeJoinRequest);
  } catch (error) {
    console.error('Error updating join request:', error);
    res.status(500).json({ message: 'Error updating join request' });
  }
});

// New PUT route for updating status - Supports the same functionality but with PUT method and different URL
router.put('/:requestId/status', authMiddleware, async (req, res) => {
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
    const joinRequestQuery = `
      SELECT jr.*, r.id as roleId, r.title as roleTitle, r.isOpen as roleIsOpen,
             s.id as startupId, s.name as startupName, s.ownerId as startupOwnerId
      FROM join_requests jr
      JOIN roles r ON jr.roleId = r.id
      JOIN startups s ON r.startupId = s.id
      WHERE jr.id = ?
    `;
    const joinRequestsData = await db.raw(joinRequestQuery, [requestId]);
    
    if (!joinRequestsData || joinRequestsData.length === 0) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    
    const joinRequest = joinRequestsData[0];

    // Check if the user is the startup owner
    if (joinRequest.startupOwnerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    // Update the join request status
    const updatedRequest = await db.update('join_requests', requestId, { 
      status, 
      updatedAt: new Date()
    });
    
    // Get user data for notification
    const requestUser = await db.findOne('users', { id: joinRequest.userId });

    // Create notification for the user who made the request
    try {
      const notificationId = uuidv4();
      await db.create('notifications', {
        id: notificationId,
          userId: joinRequest.userId,
          title: `Join Request ${status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
          message: status === 'ACCEPTED' 
          ? `Your request to join ${joinRequest.startupName} as ${joinRequest.roleTitle} has been accepted!` 
          : `Your request to join ${joinRequest.startupName} as ${joinRequest.roleTitle} has been rejected.`,
          type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
          isRead: false,
          data: JSON.stringify({
          startupId: joinRequest.startupId,
            roleId: joinRequest.roleId,
            requestId: joinRequest.id
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Created notification for user ${joinRequest.userId} about request ${status}`);
    } catch (notifError) {
      console.error('Error creating user notification:', notifError);
      // Continue even if notification creation fails
    }

    // If accepted, update the role to closed and create user role assignment
    if (status === 'ACCEPTED') {
      // First check if the role is still open
      const role = await db.findOne('roles', { id: joinRequest.roleId });
      
      if (!role || !role.isOpen) {
        return res.status(400).json({ message: 'This role is no longer available' });
      }
      
      // Close the role
      await db.update('roles', joinRequest.roleId, { 
        isOpen: false,
        updatedAt: new Date()
      });
      
      // Create a UserRole record to assign the user to this role
      try {
        // First check if a UserRole already exists
        const existingRoleQuery = `
          SELECT * FROM user_roles 
          WHERE userId = ? AND roleId = ?
        `;
        const existingRoles = await db.raw(existingRoleQuery, [joinRequest.userId, joinRequest.roleId]);

        if (existingRoles && existingRoles.length > 0) {
          console.log('UserRole already exists:', existingRoles[0]);
          return res.status(400).json({ message: 'User is already assigned to this role' });
        }

        // Create the UserRole record
        const userRoleId = uuidv4();
        const userRole = await db.create('user_roles', {
          id: userRoleId,
            userId: joinRequest.userId,
            roleId: joinRequest.roleId,
          startupId: joinRequest.startupId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log('Created UserRole:', userRole);
        
        // Award points similar to the PATCH endpoint
        // Determine points to award based on role type
        let pointsToAward = 10; // Default points for regular employees
        let reason = 'Joined a startup as a team member';
        
        // Award different points based on role title or type
        const roleTitle = joinRequest.roleTitle.toLowerCase();
        const roleType = joinRequest.roleType?.toLowerCase() || '';
        
        if (roleTitle.includes('admin') || roleTitle.includes('founder') || roleTitle.includes('co-founder')) {
          pointsToAward = 50;
          reason = 'Joined a startup as an admin';
        } else if (roleTitle.includes('manager') || roleTitle.includes('lead') || roleTitle.includes('head')) {
          pointsToAward = 20;
          reason = 'Joined a startup as a manager';
        }
        
        // Record the points transaction
        const transactionId = uuidv4();
        await db.create('points_transactions', {
          id: transactionId,
            userId: joinRequest.userId,
            amount: pointsToAward,
            reason,
            meta: JSON.stringify({
            startupId: joinRequest.startupId,
            startupName: joinRequest.startupName,
              roleId: joinRequest.roleId,
            roleTitle: joinRequest.roleTitle
          }),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Update user's points
        const user = await db.findOne('users', { id: joinRequest.userId });
        const newPoints = (user.points || 0) + pointsToAward;
        await db.update('users', joinRequest.userId, {
          points: newPoints,
          updatedAt: new Date()
        });
        
        // Calculate and update level if needed
        const newLevel = Math.floor(newPoints / 100) + 1;
        if (user.level !== newLevel) {
          await db.update('users', joinRequest.userId, { 
            level: newLevel,
            updatedAt: new Date()
          });
        }
      } catch (userRoleError) {
        console.error('Error creating user role assignment:', userRoleError);
        // Don't fail the whole request if this secondary operation fails
      }
    }

    // Get complete updated data for response
    const completeJoinRequest = {
      ...updatedRequest,
      role: {
        id: joinRequest.roleId,
        title: joinRequest.roleTitle,
        startup: {
          id: joinRequest.startupId,
          name: joinRequest.startupName
        }
      },
      user: requestUser
    };

    res.json(completeJoinRequest);
  } catch (error) {
    console.error('Error updating join request:', error);
    res.status(500).json({ message: 'Error updating join request' });
  }
});

// Delete a join request (user can only delete their own requests)
router.delete('/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Get the join request
    const joinRequestQuery = `
      SELECT jr.*, s.ownerId as startupOwnerId 
      FROM join_requests jr
      JOIN roles r ON jr.roleId = r.id
      JOIN startups s ON r.startupId = s.id
      WHERE jr.id = ?
    `;
    const joinRequestsData = await db.raw(joinRequestQuery, [requestId]);
    
    if (!joinRequestsData || joinRequestsData.length === 0) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    
    const joinRequest = joinRequestsData[0];

    // Only the request creator or startup owner can delete it
    if (joinRequest.userId !== userId && joinRequest.startupOwnerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You cannot delete this request' });
    }

    // Delete the join request
    await db.delete('join_requests', requestId);

    res.json({ message: 'Join request deleted successfully' });
  } catch (error) {
    console.error('Error deleting join request:', error);
    res.status(500).json({ message: 'Error deleting join request' });
  }
});

module.exports = router; 