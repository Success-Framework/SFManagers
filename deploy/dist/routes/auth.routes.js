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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();
// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Register a new user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Check if user already exists
        const existingUser = yield prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        // Hash password
        const hashedPassword = yield bcrypt.hash(password, 10);
        // Create user
        const user = yield prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null
            }
        });
        // Create token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        // Return user data and token (excluding password)
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(201).json({
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'Failed to register user' });
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Verify password
        const isPasswordValid = yield bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Create token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        // Return user data and token (excluding password)
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(200).json({
            user: userWithoutPassword,
            token
        });
    }
    catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: 'Failed to login' });
    }
}));
// Get current user
router.get('/me', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get token from header
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication token is required' });
        }
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        // Make sure we have a userId from the token
        if (!decoded.userId) {
            return res.status(401).json({ error: 'Invalid token: missing user ID' });
        }
        // Find user
        const user = yield prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                ownedStartups: true,
                joinedRoles: {
                    include: {
                        role: {
                            include: {
                                startup: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Return user data (excluding password)
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(200).json(userWithoutPassword);
    }
    catch (error) {
        console.error('Error getting user:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        return res.status(500).json({ error: 'Failed to get user' });
    }
}));
// Add a route to get startups the user has joined through roles
router.get('/joined-startups', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        // Get all roles the user has been assigned to through user_role table
        const userRoles = yield prisma.userRole.findMany({
            where: {
                userId: userId
            },
            include: {
                role: {
                    include: {
                        startup: true
                    }
                }
            }
        });
        // Transform the data for easier consumption in the frontend
        const joinedStartups = userRoles.map(userRole => ({
            id: userRole.role.startup.id,
            name: userRole.role.startup.name,
            details: userRole.role.startup.details,
            stage: userRole.role.startup.stage,
            ownerId: userRole.role.startup.ownerId,
            createdAt: userRole.role.startup.createdAt,
            roles: [{
                    id: userRole.role.id,
                    title: userRole.role.title,
                    isOpen: userRole.role.isOpen
                }]
        }));
        res.json(joinedStartups);
    }
    catch (error) {
        console.error('Error fetching joined startups:', error);
        res.status(500).json({ msg: 'Error fetching joined startups' });
    }
}));
// Change password
router.put('/change-password', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        // Find user
        const user = yield prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify current password
        const isPasswordValid = yield bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Hash new password
        const hashedNewPassword = yield bcrypt.hash(newPassword, 10);
        // Update user password
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword
            }
        });
        // Return success
        return res.status(200).json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ error: 'Failed to change password' });
    }
}));
module.exports = router;
