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
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const prisma = new PrismaClient();
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});
// Get user profile with points and level
router.get('/profile', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                headline: true,
                bio: true,
                location: true,
                profileImage: true,
                linkedinUrl: true,
                githubUrl: true,
                portfolio: true,
                phone: true,
                points: true,
                level: true,
                createdAt: true,
                updatedAt: true,
                skills: true,
                education: {
                    orderBy: {
                        startDate: 'desc'
                    }
                },
                experience: {
                    orderBy: {
                        startDate: 'desc'
                    }
                },
                pointsHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(user);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
}));
// Get public profile by ID (for startup founders to view applicants)
router.get('/profile/:userId', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                headline: true,
                bio: true,
                location: true,
                profileImage: true,
                linkedinUrl: true,
                githubUrl: true,
                portfolio: true,
                points: true,
                level: true,
                skills: true,
                education: {
                    orderBy: {
                        startDate: 'desc'
                    }
                },
                experience: {
                    orderBy: {
                        startDate: 'desc'
                    }
                },
                joinedRoles: {
                    include: {
                        role: {
                            include: {
                                startup: {
                                    select: {
                                        id: true,
                                        name: true,
                                        logo: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(user);
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
}));
// Update basic user profile information
router.put('/profile', authMiddleware, upload.single('profileImage'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        let { name, headline, bio, location, linkedinUrl, githubUrl, portfolio, phone } = req.body;
        // Prepare data for update
        const updateData = {
            name,
            headline,
            bio,
            location,
            linkedinUrl,
            githubUrl,
            portfolio,
            phone
        };
        // If a profile image was uploaded
        if (req.file) {
            updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
        }
        // Update user profile
        const updatedUser = yield prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        return res.json(updatedUser);
    }
    catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
}));
// Add skills to user profile
router.post('/profile/skills', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { skills } = req.body;
        if (!skills || !Array.isArray(skills)) {
            return res.status(400).json({ error: 'Skills must be provided as an array' });
        }
        // Delete existing skills
        yield prisma.skill.deleteMany({
            where: { userId }
        });
        // Add new skills
        const skillPromises = skills.map(skill => prisma.skill.create({
            data: {
                name: skill,
                userId
            }
        }));
        yield Promise.all(skillPromises);
        // Get updated user with skills
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            include: { skills: true }
        });
        return res.json(user.skills);
    }
    catch (error) {
        console.error('Error updating skills:', error);
        return res.status(500).json({ error: 'Failed to update skills' });
    }
}));
// Add education to user profile
router.post('/profile/education', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { school, degree, fieldOfStudy, startDate, endDate, description } = req.body;
        if (!school || !degree || !fieldOfStudy || !startDate) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }
        const education = yield prisma.education.create({
            data: {
                school,
                degree,
                fieldOfStudy,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                description,
                userId
            }
        });
        return res.status(201).json(education);
    }
    catch (error) {
        console.error('Error adding education:', error);
        return res.status(500).json({ error: 'Failed to add education' });
    }
}));
// Update education
router.put('/profile/education/:id', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { school, degree, fieldOfStudy, startDate, endDate, description } = req.body;
        // Check if education exists and belongs to the user
        const existingEducation = yield prisma.education.findUnique({
            where: { id }
        });
        if (!existingEducation) {
            return res.status(404).json({ error: 'Education not found' });
        }
        if (existingEducation.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this education' });
        }
        const updatedEducation = yield prisma.education.update({
            where: { id },
            data: {
                school,
                degree,
                fieldOfStudy,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                description
            }
        });
        return res.json(updatedEducation);
    }
    catch (error) {
        console.error('Error updating education:', error);
        return res.status(500).json({ error: 'Failed to update education' });
    }
}));
// Delete education
router.delete('/profile/education/:id', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if education exists and belongs to the user
        const existingEducation = yield prisma.education.findUnique({
            where: { id }
        });
        if (!existingEducation) {
            return res.status(404).json({ error: 'Education not found' });
        }
        if (existingEducation.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this education' });
        }
        yield prisma.education.delete({
            where: { id }
        });
        return res.json({ message: 'Education deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting education:', error);
        return res.status(500).json({ error: 'Failed to delete education' });
    }
}));
// Add experience to user profile
router.post('/profile/experience', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { title, company, location, startDate, endDate, current, description } = req.body;
        if (!title || !company || !startDate) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }
        const experience = yield prisma.experience.create({
            data: {
                title,
                company,
                location,
                startDate: new Date(startDate),
                endDate: current ? null : endDate ? new Date(endDate) : null,
                current: !!current,
                description,
                userId
            }
        });
        return res.status(201).json(experience);
    }
    catch (error) {
        console.error('Error adding experience:', error);
        return res.status(500).json({ error: 'Failed to add experience' });
    }
}));
// Update experience
router.put('/profile/experience/:id', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, company, location, startDate, endDate, current, description } = req.body;
        // Check if experience exists and belongs to the user
        const existingExperience = yield prisma.experience.findUnique({
            where: { id }
        });
        if (!existingExperience) {
            return res.status(404).json({ error: 'Experience not found' });
        }
        if (existingExperience.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this experience' });
        }
        const updatedExperience = yield prisma.experience.update({
            where: { id },
            data: {
                title,
                company,
                location,
                startDate: new Date(startDate),
                endDate: current ? null : endDate ? new Date(endDate) : null,
                current: !!current,
                description
            }
        });
        return res.json(updatedExperience);
    }
    catch (error) {
        console.error('Error updating experience:', error);
        return res.status(500).json({ error: 'Failed to update experience' });
    }
}));
// Delete experience
router.delete('/profile/experience/:id', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        // Check if experience exists and belongs to the user
        const existingExperience = yield prisma.experience.findUnique({
            where: { id }
        });
        if (!existingExperience) {
            return res.status(404).json({ error: 'Experience not found' });
        }
        if (existingExperience.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this experience' });
        }
        yield prisma.experience.delete({
            where: { id }
        });
        return res.json({ message: 'Experience deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting experience:', error);
        return res.status(500).json({ error: 'Failed to delete experience' });
    }
}));
// Add points to a user
router.post('/points', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { amount, reason, meta } = req.body;
        // Validate input
        if (!amount || !reason) {
            return res.status(400).json({ error: 'Amount and reason are required' });
        }
        // Start a transaction to ensure data consistency
        const updatedUser = yield prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            // Create a points transaction record
            yield prisma.pointsTransaction.create({
                data: {
                    userId,
                    amount,
                    reason,
                    meta
                }
            });
            // Update user's points
            const user = yield prisma.user.update({
                where: { id: userId },
                data: {
                    points: {
                        increment: amount
                    }
                }
            });
            // Calculate level based on points (100 points per level)
            const newLevel = Math.floor(user.points / 100) + 1;
            // Update level if changed
            if (user.level !== newLevel) {
                return prisma.user.update({
                    where: { id: userId },
                    data: { level: newLevel }
                });
            }
            return user;
        }));
        return res.json(updatedUser);
    }
    catch (error) {
        console.error('Error adding points:', error);
        return res.status(500).json({ error: 'Failed to add points' });
    }
}));
// Get user's points history
router.get('/points/history', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const history = yield prisma.pointsTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });
        const total = yield prisma.pointsTransaction.count({
            where: { userId }
        });
        return res.json({
            data: history,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching points history:', error);
        return res.status(500).json({ error: 'Failed to fetch points history' });
    }
}));
module.exports = router;
