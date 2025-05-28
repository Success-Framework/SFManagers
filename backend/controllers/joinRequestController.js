import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export const createJoinRequest = async (req, res) => {
  try {
    const { roleId, message } = req.body;
    const userId = req.user.id;

    if (!roleId) {
      return res.status(400).json({ message: 'Role ID is required' });
    }

    const role = await db.findOne('roles', { id: roleId });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (!role.isOpen) {
      return res.status(400).json({ message: 'This role is not open for applications' });
    }

    const startup = await db.findOne('startups', { id: role.startupId });
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    const existingRequestQuery = `
      SELECT * FROM JoinRequest 
      WHERE userId = ? AND roleId = ? AND status = 'PENDING'
    `;
    const existingRequests = await db.raw(existingRequestQuery, [userId, roleId]);
    if (existingRequests?.length > 0) {
      return res.status(400).json({ message: 'You already have a pending request for this role' });
    }
    
    // Check if the user is not the owner of the startup
    if (startup.ownerId === userId) {
      return res.status(400).json({ message: 'You cannot join your own startup' });
    }

    // Get user for notification
    const user = await db.findOne('user', { id: userId });

    const joinRequestId = uuidv4();
    const joinRequest = await db.create('JoinRequest', {
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

    // Create notification for the startup owner
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
          roleId,
          requestId: joinRequestId,
          userId
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (notifError) {
      console.error('Error creating owner notification:', notifError);
      // Continue even if notification creation fails
    }

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
};

export const getStartupJoinRequests = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    const startup = await db.findOne('startups', { id: startupId });
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    if (startup.ownerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    const joinRequestsQuery = `
      SELECT jr.*, u.id as userId, u.name as userName, u.email as userEmail, 
             r.id as roleId, r.title as roleTitle, r.roleType as roleType 
      FROM JoinRequest jr
      JOIN User u ON jr.userId = u.id
      JOIN Role r ON jr.roleId = r.id
      WHERE jr.startupId = ?
      ORDER BY jr.createdAt DESC
    `;
    const joinRequestsData = await db.raw(joinRequestsQuery, [startupId]);
    
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
};

export const getUserJoinRequests = async (req, res) => {
  try {
    const userId = req.user.id;

      // First check if the user exists
      const userCheck = await db.raw('SELECT id FROM User WHERE id = ?', [userId]);
      console.log('User check result:', userCheck);

    // Get all join requests for the user with related data
    const joinRequestsQuery = `
      SELECT 
        jr.*,
        r.id as roleId, r.title as roleTitle, r.roleType as roleType,
        s.id as startupId, s.name as startupName
      FROM JoinRequest jr
      JOIN Role r ON jr.roleId = r.id
      JOIN Startup s ON jr.startupId = s.id
      WHERE jr.userId = ?
      ORDER BY jr.createdAt DESC
    `;
    
    const joinRequestsData = await db.raw(joinRequestsQuery, [userId]);
    
    const joinRequests = joinRequestsData.map(jr => ({
      id: jr.id,
      userId: jr.userId,
      roleId: jr.roleId,
      startupId: jr.startupId,
      status: jr.status,
      message: jr.message,
      receiverId: jr.receiverId,
      createdAt: jr.createdAt,
      updatedAt: jr.updatedAt,
      role: {
        id: jr.roleId,
        title: jr.roleTitle,
        roleType: jr.roleType
      },
      startup: {
        id: jr.startupId,
        name: jr.startupName
      }
    }));

    res.json(joinRequests);
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ 
      message: 'Error fetching join requests',
      error: error.message,
      details: error.sqlMessage || error.code
    });
  }
};

// Special endpoint that just returns an empty array
// This is used as a fallback in case the JoinRequest table doesn't exist yet
// router.get('/me/stub', authMiddleware, async (req, res) => {
//     try {
//       console.log('Using stub endpoint to return empty array');
//       // Always return empty array for this endpoint - no database queries
//       res.json([]);
//     } catch (error) {
//       console.error('Error in stub endpoint:', error);
//       res.json([]);
//     }
//   });

export const updateJoinRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    let { status } = req.body;
    const userId = req.user.id;

    if (status === 'APPROVED') {
      status = 'ACCEPTED';
    }

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (ACCEPTED or REJECTED) is required' });
    }

    const joinRequestQuery = `
      SELECT jr.*, r.id as roleId, r.title as roleTitle, r.isOpen as roleIsOpen,
             s.id as startupId, s.name as startupName, s.logo_url as startupLogo,
             s.ownerId as startupOwnerId
      FROM JoinRequest jr
      JOIN Role r ON jr.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE jr.id = ?
    `;
    const joinRequestsData = await db.raw(joinRequestQuery, [requestId]);
    
    if (!joinRequestsData?.length) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    
    const joinRequest = joinRequestsData[0];

    if (joinRequest.startupOwnerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
    }

    const updatedRequest = await db.update('JoinRequest', requestId, { 
      status, 
      updatedAt: new Date()
    });
    
    const requestUser = await db.findOne('User', { id: joinRequest.userId });

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
    } catch (notifError) {
      console.error('Error creating user notification:', notifError);
    }

    if (status === 'ACCEPTED') {
      const role = await db.findOne('roles', { id: joinRequest.roleId });
      
      if (!role?.isOpen) {
        return res.status(400).json({ message: 'This role is no longer available' });
      }
      
      await db.update('roles', joinRequest.roleId, { 
        isOpen: false,
        updatedAt: new Date()
      });
      
      try {
        const existingRoleQuery = `
          SELECT * FROM UserRole 
          WHERE userId = ? AND roleId = ?
        `;
        const existingRoles = await db.raw(existingRoleQuery, [joinRequest.userId, joinRequest.roleId]);

        if (existingRoles?.length > 0) {
          return res.status(400).json({ message: 'User is already assigned to this role' });
        }

        const userRoleId = uuidv4();
        await db.create('UserRole', {
          id: userRoleId,
          userId: joinRequest.userId,
          roleId: joinRequest.roleId,
          startupId: joinRequest.startupId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        let pointsToAward = 10;
        let reason = 'Joined a startup as a team member';
        
        const roleTitle = joinRequest.roleTitle.toLowerCase();
        const roleType = joinRequest.roleType?.toLowerCase() || '';
        
        if (roleTitle.includes('admin') || roleTitle.includes('founder') || roleTitle.includes('co-founder')) {
          pointsToAward = 50;
          reason = 'Joined a startup as an admin';
        } else if (roleTitle.includes('manager') || roleTitle.includes('lead') || roleTitle.includes('head')) {
          pointsToAward = 20;
          reason = 'Joined a startup as a manager';
        }
        
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
        
        const user = await db.findOne('User', { id: joinRequest.userId });
        const newPoints = (user.points || 0) + pointsToAward;
        await db.update('User', joinRequest.userId, {
          points: newPoints,
          updatedAt: new Date()
        });
        
        const newLevel = Math.floor(newPoints / 100) + 1;
        if (user.level !== newLevel) {
          await db.update('User', joinRequest.userId, { 
            level: newLevel,
            updatedAt: new Date()
          });
        }
      } catch (userRoleError) {
        console.error('Error creating user role assignment:', userRoleError);
      }
    }

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
};

export const deleteJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const joinRequestQuery = `
      SELECT jr.*, s.ownerId as startupOwnerId 
      FROM JoinRequest jr
      JOIN Role r ON jr.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE jr.id = ?
    `;
    const joinRequestsData = await db.raw(joinRequestQuery, [requestId]);
    
    if (!joinRequestsData?.length) {
      return res.status(404).json({ message: 'Join request not found' });
    }
    
    const joinRequest = joinRequestsData[0];

    if (joinRequest.userId !== userId && joinRequest.startupOwnerId !== userId) {
      return res.status(403).json({ message: 'Unauthorized: You cannot delete this request' });
    }

    await db.delete('JoinRequest', requestId);

    res.json({ message: 'Join request deleted successfully' });
  } catch (error) {
    console.error('Error deleting join request:', error);
    res.status(500).json({ message: 'Error deleting join request' });
  }
};

export const getReceivedJoinRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const joinRequestsQuery = `
      SELECT 
        jr.*,
        r.id as roleId, r.title as roleTitle, r.roleType as roleType,
        s.id as startupId, s.name as startupName,
        u.id as userId, u.name as userName, u.email as userEmail
      FROM JoinRequest jr
      JOIN Role r ON jr.roleId = r.id
      JOIN Startup s ON jr.startupId = s.id
      JOIN User u ON jr.userId = u.id
      WHERE jr.receiverId = ?
      ORDER BY jr.createdAt DESC
    `;
    
    const joinRequestsData = await db.raw(joinRequestsQuery, [userId]);
    
    const joinRequests = joinRequestsData.map(jr => ({
      id: jr.id,
      userId: jr.userId,
      roleId: jr.roleId,
      startupId: jr.startupId,
      status: jr.status,
      message: jr.message,
      receiverId: jr.receiverId,
      createdAt: jr.createdAt,
      updatedAt: jr.updatedAt,
      role: {
        id: jr.roleId,
        title: jr.roleTitle,
        roleType: jr.roleType
      },
      startup: {
        id: jr.startupId,
        name: jr.startupName
      },
      user: {
        id: jr.userId,
        name: jr.userName,
        email: jr.userEmail
      }
    }));

    res.json(joinRequests);
  } catch (error) {
    console.error('Error fetching received join requests:', error);
    res.status(500).json({ 
      message: 'Error fetching received join requests',
      error: error.message,
      details: error.sqlMessage || error.code
    });
  }
};

export const getJoinRequestsStub = async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error('Error in stub endpoint:', error);
    res.json([]);
  }
};

