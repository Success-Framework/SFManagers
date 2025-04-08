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
const axios = require('axios');
const prisma = new PrismaClient();
// Track click for an affiliate link
router.post('/track', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, referrer } = req.body;
        console.log('Tracking click for affiliate code:', code);
        if (!code) {
            return res.status(400).json({ error: 'Link code is required' });
        }
        // Find the link by code
        const link = yield prisma.affiliateLink.findUnique({
            where: { code },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!link) {
            console.log('Link not found for code:', code);
            return res.status(404).json({ error: 'Affiliate link not found' });
        }
        console.log('Link found:', link.name, '(ID:', link.id, ')');
        // Get IP and user agent information
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        // Record the click without geolocation data
        const click = yield prisma.affiliateClick.create({
            data: {
                linkId: link.id,
                ipAddress,
                userAgent,
                referrer
            }
        });
        console.log('Click recorded successfully:', click.id);
        // Update the click count on the link
        yield prisma.affiliateLink.update({
            where: { id: link.id },
            data: { clicks: { increment: 1 } }
        });
        console.log('Link click count updated.');
        // Award 1 point to the user for the affiliate click
        try {
            if (link.user && link.user.id) {
                // Record the points transaction
                yield prisma.pointsTransaction.create({
                    data: {
                        userId: link.user.id,
                        amount: 1,
                        reason: 'Affiliate link click',
                        meta: JSON.stringify({
                            linkId: link.id,
                            linkName: link.name,
                            clickId: click.id
                        })
                    }
                });
                // Update user's points
                const user = yield prisma.user.update({
                    where: { id: link.user.id },
                    data: {
                        points: {
                            increment: 1
                        }
                    }
                });
                // Update level if needed
                const newLevel = Math.floor(user.points / 100) + 1;
                if (user.level !== newLevel) {
                    yield prisma.user.update({
                        where: { id: link.user.id },
                        data: { level: newLevel }
                    });
                }
                console.log(`Awarded 1 point to user ${link.user.id} for affiliate click`);
            }
        }
        catch (pointsError) {
            console.error('Error awarding points for affiliate click:', pointsError);
            // Continue even if points awarding fails
        }
        res.status(201).json({ success: true });
    }
    catch (error) {
        console.error('Error tracking affiliate click:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get click data for an affiliate link
router.get('/:linkId', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { linkId } = req.params;
        const { timeRange } = req.query;
        console.log(`Fetching clicks for link ${linkId} with timeRange ${timeRange}`);
        console.log('User ID:', req.user.id);
        // Find the link
        const link = yield prisma.affiliateLink.findUnique({
            where: { id: linkId }
        });
        if (!link) {
            console.log(`Link with ID ${linkId} not found`);
            return res.status(404).json({ error: 'Affiliate link not found' });
        }
        console.log(`Link found: ${link.name} (userId: ${link.userId}, startupId: ${link.startupId})`);
        // Check if the user is authorized to access this data
        if (link.userId !== req.user.id) {
            console.log('User is not the link owner, checking startup access');
            const hasAccess = yield validateLinkAccess(req.user.id, link.startupId);
            if (!hasAccess) {
                console.log('Access denied: user does not have access to this startup');
                return res.status(403).json({ error: 'Unauthorized to access this data' });
            }
            console.log('Access granted: user has access to the startup');
        }
        else {
            console.log('Access granted: user is the link owner');
        }
        // Prepare date filter based on timeRange
        const dateFilter = {};
        if (timeRange) {
            const now = new Date();
            switch (timeRange) {
                case 'week':
                    // Last 7 days
                    dateFilter.gte = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    // Last 30 days
                    dateFilter.gte = new Date(now.setDate(now.getDate() - 30));
                    break;
                case 'year':
                    // Last 365 days
                    dateFilter.gte = new Date(now.setDate(now.getDate() - 365));
                    break;
                // 'all' or any other value: no date filter
            }
        }
        console.log('Date filter:', dateFilter);
        // Get all clicks for this link
        const clicks = yield prisma.affiliateClick.findMany({
            where: Object.assign({ linkId }, (Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})),
            orderBy: {
                createdAt: 'desc'
            }
        });
        console.log(`Found ${clicks.length} clicks for link ${linkId}`);
        res.json(clicks);
    }
    catch (error) {
        console.error('Error fetching affiliate clicks:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
}));
// Helper function to validate if a user has access to a startup's data
const validateLinkAccess = (userId, startupId) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user is the owner or has a managerial role in the startup
    const startup = yield prisma.startup.findUnique({
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
            OR: [
                { title: { contains: 'admin', mode: 'insensitive' } },
                { title: { contains: 'manager', mode: 'insensitive' } }
            ]
        }
    });
    return !!adminRole;
});
module.exports = router;
