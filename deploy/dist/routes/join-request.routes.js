"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();
// Create a join request
router.post('/', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleId, message } = req.body;
        const userId = req.user.id;
        if (!roleId) {
            return res.status(400).json({ message: 'Role ID is required' });
        }
        // Get the role and check if it exists and is open
        const role = yield prisma.role.findUnique({
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
        const existingRequest = yield prisma.joinRequest.findFirst({
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
        const joinRequest = yield prisma.joinRequest.create({
            data: {
                userId,
                roleId,
                startupId: role.startup.id,
                receiverId: role.startup.ownerId,
                message: message || undefined,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                role: {
                    include: {
                        startup: true
                    }
                }
            }
        });
        // Create a notification for the startup owner
        try {
            const startupOwnerId = role.startup.ownerId;
            yield prisma.notification.create({
                data: {
                    userId: startupOwnerId,
                    title: 'New Join Request',
                    message: `${joinRequest.user.name} wants to join your startup as ${role.title}`,
                    type: 'INFO',
                    isRead: false,
                    data: JSON.stringify({
                        startupId: role.startup.id,
                        roleId: roleId,
                        requestId: joinRequest.id,
                        userId: userId
                    })
                }
            });
            console.log(`Created notification for startup owner ${startupOwnerId} about new join request`);
        }
        catch (notifError) {
            console.error('Error creating owner notification:', notifError);
            // Continue even if notification creation fails
        }
        res.status(201).json(joinRequest);
    }
    catch (error) {
        console.error('Error creating join request:', error);
        res.status(500).json({ message: 'Error creating join request' });
    }
}));
// Get all join requests for a startup (owner only)
router.get('/startup/:startupId', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startupId } = req.params;
        const userId = req.user.id;
        // Check if the user is the startup owner
        const startup = yield prisma.startup.findUnique({
            where: { id: startupId }
        });
        if (!startup) {
            return res.status(404).json({ message: 'Startup not found' });
        }
        if (startup.ownerId !== userId) {
            return res.status(403).json({ message: 'Unauthorized: You are not the owner of this startup' });
        }
        // Get all join requests for the startup's roles
        const joinRequests = yield prisma.joinRequest.findMany({
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
    }
    catch (error) {
        console.error('Error fetching join requests:', error);
        res.status(500).json({ message: 'Error fetching join requests' });
    }
}));
// Get current user's join requests
router.get('/me', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const joinRequests = yield prisma.joinRequest.findMany({
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
    }
    catch (error) {
        console.error('Error fetching user join requests:', error);
        res.status(500).json({ message: 'Error fetching user join requests' });
    }
}));
// Update join request status (accept/reject) - startup owner only
router.patch('/:requestId', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Valid status (ACCEPTED or REJECTED) is required' });
        }
        // Get the join request with related data
        const joinRequest = yield prisma.joinRequest.findUnique({
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
        const updatedRequest = yield prisma.joinRequest.update({
            where: { id: requestId },
            data: { status },
            include: {
                role: {
                    include: {
                        startup: true
                    }
                },
                user: true
            }
        });
        // Create notification for the user who made the request
        try {
            yield prisma.notification.create({
                data: {
                    userId: joinRequest.userId,
                    title: `Join Request ${status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
                    message: status === 'ACCEPTED'
                        ? `Your request to join ${joinRequest.role.startup.name} as ${joinRequest.role.title} has been accepted!`
                        : `Your request to join ${joinRequest.role.startup.name} as ${joinRequest.role.title} has been rejected.`,
                    type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
                    isRead: false,
                    data: JSON.stringify({
                        startupId: joinRequest.role.startup.id,
                        roleId: joinRequest.roleId,
                        requestId: joinRequest.id
                    })
                }
            });
            console.log(`Created notification for user ${joinRequest.userId} about request ${status}`);
        }
        catch (notifError) {
            console.error('Error creating user notification:', notifError);
            // Continue even if notification creation fails
        }
        // If accepted, update the role to closed and create user role assignment
        if (status === 'ACCEPTED') {
            // First check if the role is still open
            const role = yield prisma.role.findUnique({
                where: { id: joinRequest.roleId }
            });
            if (!role || !role.isOpen) {
                return res.status(400).json({ message: 'This role is no longer available' });
            }
            // Close the role
            yield prisma.role.update({
                where: { id: joinRequest.roleId },
                data: { isOpen: false }
            });
            // Create a UserRole record to assign the user to this role
            try {
                // First check if a UserRole already exists
                const existingUserRole = yield prisma.userRole.findUnique({
                    where: {
                        userId_roleId: {
                            userId: joinRequest.userId,
                            roleId: joinRequest.roleId
                        }
                    }
                });
                if (existingUserRole) {
                    console.log('UserRole already exists:', existingUserRole);
                    return res.status(400).json({ message: 'User is already assigned to this role' });
                }
                // Create the UserRole record
                const userRole = yield prisma.userRole.create({
                    data: {
                        userId: joinRequest.userId,
                        roleId: joinRequest.roleId,
                        startupId: joinRequest.role.startup.id
                    }
                });
                console.log('Created UserRole:', userRole);
                // Determine points to award based on role type
                let pointsToAward = 10; // Default points for regular employees
                let reason = 'Joined a startup as a team member';
                // Award different points based on role title or type
                const roleTitle = role.title.toLowerCase();
                const roleType = role.roleType.toLowerCase();
                if (roleTitle.includes('admin') || roleTitle.includes('founder') || roleTitle.includes('co-founder')) {
                    pointsToAward = 50;
                    reason = 'Joined a startup as an admin';
                }
                else if (roleTitle.includes('manager') || roleTitle.includes('lead') || roleTitle.includes('head')) {
                    pointsToAward = 20;
                    reason = 'Joined a startup as a manager';
                }
                // Record the points transaction
                yield prisma.pointsTransaction.create({
                    data: {
                        userId: joinRequest.userId,
                        amount: pointsToAward,
                        reason,
                        meta: JSON.stringify({
                            startupId: joinRequest.role.startup.id,
                            startupName: joinRequest.role.startup.name,
                            roleId: joinRequest.roleId,
                            roleTitle: role.title
                        })
                    }
                });
                // Update user's points
                const user = yield prisma.user.update({
                    where: { id: joinRequest.userId },
                    data: {
                        points: {
                            increment: pointsToAward
                        }
                    }
                });
                // Calculate and update level if needed
                const newLevel = Math.floor(user.points / 100) + 1;
                if (user.level !== newLevel) {
                    yield prisma.user.update({
                        where: { id: joinRequest.userId },
                        data: { level: newLevel }
                    });
                }
            }
            catch (userRoleError) {
                console.error('Error creating user role assignment:', userRoleError);
                // Don't fail the whole request if this secondary operation fails
            }
        }
        res.json(updatedRequest);
    }
    catch (error) {
        console.error('Error updating join request:', error);
        res.status(500).json({ message: 'Error updating join request' });
    }
}));
// New PUT route for updating status - Supports the same functionality but with PUT method and different URL
router.put('/:requestId/status', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const joinRequest = yield prisma.joinRequest.findUnique({
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
        const updatedRequest = yield prisma.joinRequest.update({
            where: { id: requestId },
            data: { status },
            include: {
                role: {
                    include: {
                        startup: true
                    }
                },
                user: true
            }
        });
        // Create notification for the user who made the request
        try {
            yield prisma.notification.create({
                data: {
                    userId: joinRequest.userId,
                    title: `Join Request ${status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
                    message: status === 'ACCEPTED'
                        ? `Your request to join ${joinRequest.role.startup.name} as ${joinRequest.role.title} has been accepted!`
                        : `Your request to join ${joinRequest.role.startup.name} as ${joinRequest.role.title} has been rejected.`,
                    type: status === 'ACCEPTED' ? 'SUCCESS' : 'INFO',
                    isRead: false,
                    data: JSON.stringify({
                        startupId: joinRequest.role.startup.id,
                        roleId: joinRequest.roleId,
                        requestId: joinRequest.id
                    })
                }
            });
            console.log(`Created notification for user ${joinRequest.userId} about request ${status}`);
        }
        catch (notifError) {
            console.error('Error creating user notification:', notifError);
            // Continue even if notification creation fails
        }
        // If accepted, update the role to closed and create user role assignment
        if (status === 'ACCEPTED') {
            // First check if the role is still open
            const role = yield prisma.role.findUnique({
                where: { id: joinRequest.roleId }
            });
            if (!role || !role.isOpen) {
                return res.status(400).json({ message: 'This role is no longer available' });
            }
            // Close the role
            yield prisma.role.update({
                where: { id: joinRequest.roleId },
                data: { isOpen: false }
            });
            // Create a UserRole record to assign the user to this role
            try {
                // First check if a UserRole already exists
                const existingUserRole = yield prisma.userRole.findUnique({
                    where: {
                        userId_roleId: {
                            userId: joinRequest.userId,
                            roleId: joinRequest.roleId
                        }
                    }
                });
                if (existingUserRole) {
                    console.log('UserRole already exists:', existingUserRole);
                    return res.status(400).json({ message: 'User is already assigned to this role' });
                }
                // Create the UserRole record
                const userRole = yield prisma.userRole.create({
                    data: {
                        userId: joinRequest.userId,
                        roleId: joinRequest.roleId,
                        startupId: joinRequest.role.startup.id
                    }
                });
                console.log('Created UserRole:', userRole);
                // Determine points to award based on role type
                let pointsToAward = 10; // Default points for regular employees
                let reason = 'Joined a startup as a team member';
                // Award different points based on role title or type
                const roleTitle = role.title.toLowerCase();
                const roleType = role.roleType.toLowerCase();
                if (roleTitle.includes('admin') || roleTitle.includes('founder') || roleTitle.includes('co-founder')) {
                    pointsToAward = 50;
                    reason = 'Joined a startup as an admin';
                }
                else if (roleTitle.includes('manager') || roleTitle.includes('lead') || roleTitle.includes('head')) {
                    pointsToAward = 20;
                    reason = 'Joined a startup as a manager';
                }
                // Record the points transaction
                yield prisma.pointsTransaction.create({
                    data: {
                        userId: joinRequest.userId,
                        amount: pointsToAward,
                        reason,
                        meta: JSON.stringify({
                            startupId: joinRequest.role.startup.id,
                            startupName: joinRequest.role.startup.name,
                            roleId: joinRequest.roleId,
                            roleTitle: role.title
                        })
                    }
                });
                // Update user's points
                const user = yield prisma.user.update({
                    where: { id: joinRequest.userId },
                    data: {
                        points: {
                            increment: pointsToAward
                        }
                    }
                });
                // Calculate and update level if needed
                const newLevel = Math.floor(user.points / 100) + 1;
                if (user.level !== newLevel) {
                    yield prisma.user.update({
                        where: { id: joinRequest.userId },
                        data: { level: newLevel }
                    });
                }
            }
            catch (userRoleError) {
                console.error('Error creating user role assignment:', userRoleError);
                // Don't fail the whole request if this secondary operation fails
            }
        }
        res.json(updatedRequest);
    }
    catch (error) {
        console.error('Error updating join request:', error);
        res.status(500).json({ message: 'Error updating join request' });
    }
}));
// Delete a join request (user can only delete their own requests)
router.delete('/:requestId', auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId } = req.params;
        const userId = req.user.id;
        const joinRequest = yield prisma.joinRequest.findUnique({
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
        yield prisma.joinRequest.delete({
            where: { id: requestId }
        });
        res.json({ message: 'Join request deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting join request:', error);
        res.status(500).json({ message: 'Error deleting join request' });
    }
}));
module.exports = router;
