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
const router = express.Router();
const authMiddleware = require('../middleware/auth.js');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Get affiliate links for a startup
router.get('/startup/:startupId', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startupId } = req.params;
        console.log('Looking for links for startup:', startupId);
        console.log('User ID:', req.user.id);
        console.log('Authorization header:', req.headers['x-auth-token'] ? 'Present (length: ' + req.headers['x-auth-token'].length + ')' : 'Missing');
        // Validate user has access to this startup
        const hasAccess = yield validateStartupAccess(req.user.id, startupId);
        console.log('Has access to startup:', hasAccess);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Unauthorized access to startup' });
        }
        // Get all links for this startup
        const links = yield prisma.affiliateLink.findMany({
            where: {
                startupId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log('Found links:', links.length);
        res.json(links);
    }
    catch (error) {
        console.error('Error fetching affiliate links:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get a user's affiliate links
router.get('/user', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Get all links for this user
        const links = yield prisma.affiliateLink.findMany({
            where: {
                userId
            },
            include: {
                startup: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(links);
    }
    catch (error) {
        console.error('Error fetching user affiliate links:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Create a new affiliate link
router.post('/', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, startupId } = req.body;
        const userId = req.user.id;
        if (!name || !startupId) {
            return res.status(400).json({ error: 'Name and startup ID are required' });
        }
        // Validate user has access to this startup
        const hasAccess = yield validateStartupAccess(userId, startupId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Unauthorized access to startup' });
        }
        // Generate a unique code for the link
        const code = generateLinkCode(userId, startupId);
        // Create the new link
        const newLink = yield prisma.affiliateLink.create({
            data: {
                name,
                code,
                userId,
                startupId,
                clicks: 0,
                conversions: 0
            }
        });
        res.status(201).json(newLink);
    }
    catch (error) {
        console.error('Error creating affiliate link:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Delete an affiliate link
router.delete('/:id', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Find the link
        const link = yield prisma.affiliateLink.findUnique({
            where: { id }
        });
        if (!link) {
            return res.status(404).json({ error: 'Affiliate link not found' });
        }
        // Check if the user is authorized to delete this link
        if (link.userId !== userId) {
            // Check if the user is admin or owner of the startup
            const hasAccess = yield validateStartupAdminAccess(userId, link.startupId);
            if (!hasAccess) {
                return res.status(403).json({ error: 'Unauthorized to delete this link' });
            }
        }
        // Delete the link
        yield prisma.affiliateLink.delete({
            where: { id }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting affiliate link:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Helper functions
const validateStartupAccess = (userId, startupId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('validateStartupAccess called with userId:', userId, 'startupId:', startupId);
    try {
        // First, check if the startup exists
        const startup = yield prisma.startup.findFirst({
            where: {
                id: startupId
            }
        });
        console.log('Startup found:', startup ? 'Yes' : 'No');
        if (!startup)
            return false;
        // Check if user is the owner
        const isOwner = startup.ownerId === userId;
        // If user is owner, return true immediately
        if (isOwner) {
            console.log('User is owner');
            return true;
        }
        // Check if user has a role in the startup
        const userRole = yield prisma.userRole.findFirst({
            where: {
                userId: userId,
                role: {
                    startupId: startupId
                }
            }
        });
        const hasRole = !!userRole;
        console.log('Has role:', hasRole);
        return hasRole;
    }
    catch (error) {
        console.error('Error in validateStartupAccess:', error);
        return false;
    }
});
const validateStartupAdminAccess = (userId, startupId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user is the owner or has an admin role in the startup
    const startup = yield prisma.startup.findFirst({
        where: { id: startupId }
    });
    if (!startup)
        return false;
    if (startup.ownerId === userId)
        return true;
    // Check for admin or manager role
    const adminRole = yield prisma.role.findFirst({
        where: {
            startupId,
            userRoles: {
                some: {
                    userId
                }
            },
            title: {
                contains: 'admin',
                mode: 'insensitive'
            }
        }
    });
    const managerRole = yield prisma.role.findFirst({
        where: {
            startupId,
            userRoles: {
                some: {
                    userId
                }
            },
            title: {
                contains: 'manager',
                mode: 'insensitive'
            }
        }
    });
    return !!adminRole || !!managerRole;
});
const generateLinkCode = (userId, startupId) => {
    // Create a short unique code based on user ID, startup ID and random characters
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `${userId.substring(0, 4)}${startupId.substring(0, 4)}${timestamp.substring(timestamp.length - 4)}${randomStr}`;
};
module.exports = router;
