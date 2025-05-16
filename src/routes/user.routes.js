const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { db } = require('../database');
const { prisma } = require('../prisma');

const router = express.Router();
const prismaClient = new PrismaClient();

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get user profile with points and level
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    try {
      const user = await prismaClient.user.findUnique({
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
      
      // Get level from a separate query to avoid the type conversion issue
      const userLevel = await prisma.$queryRaw`SELECT level FROM User WHERE id = ${userId}`;
      user.level = userLevel[0]?.level || 0;
      
      return res.json(user);
    } catch (error) {
      // Log the specific error
      console.error('Error in prisma query:', error);
      
      // Fallback query without the problematic fields
      const basicUser = await prismaClient.user.findUnique({
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
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!basicUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add empty arrays for related data
      basicUser.skills = [];
      basicUser.education = [];
      basicUser.experience = [];
      basicUser.pointsHistory = [];
      basicUser.level = 0;
      
      return res.json(basicUser);
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get public profile by ID (for startup founders to view applicants)
router.get('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prismaClient.user.findUnique({
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
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update basic user profile information
router.put('/profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.user.id;
    let { name, headline, bio, location, linkedinUrl, githubUrl, portfolio, phone, deleteImage } = req.body;
    
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
    } else if (deleteImage === 'true') {
      // If the user wants to delete their profile image
      updateData.profileImage = null;
      
      // Optional: Delete the old profile image file from the server
      // This would require getting the current image path first
      // and then using fs.unlink to delete it
    }
    
    // Update user profile
    const updatedUser = await prismaClient.user.update({
      where: { id: userId },
      data: updateData
    });
    
    return res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add skills to user profile
router.post('/profile/skills', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skills } = req.body;
    
    if (!skills || !Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be provided as an array' });
    }
    
    // Delete existing skills
    await prismaClient.skill.deleteMany({
      where: { userId }
    });
    
    // Add new skills
    const skillPromises = skills.map(skill => 
      prismaClient.skill.create({
        data: {
          name: skill,
          level: 1, // Default level
          userId
        }
      })
    );
    
    await Promise.all(skillPromises);
    
    // Get updated user with skills
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      include: { skills: true }
    });
    
    return res.json(user.skills);
  } catch (error) {
    console.error('Error updating skills:', error);
    return res.status(500).json({ error: 'Failed to update skills' });
  }
});

// Add education to user profile
router.post('/profile/education', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { school, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    
    if (!school || !degree || !fieldOfStudy || !startDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    
    const education = await prismaClient.education.create({
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
  } catch (error) {
    console.error('Error adding education:', error);
    return res.status(500).json({ error: 'Failed to add education' });
  }
});

// Update education
router.put('/profile/education/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { school, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    
    // Check if education exists and belongs to the user
    const existingEducation = await prismaClient.education.findUnique({
      where: { id }
    });
    
    if (!existingEducation) {
      return res.status(404).json({ error: 'Education not found' });
    }
    
    if (existingEducation.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this education' });
    }
    
    const updatedEducation = await prismaClient.education.update({
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
  } catch (error) {
    console.error('Error updating education:', error);
    return res.status(500).json({ error: 'Failed to update education' });
  }
});

// Delete education
router.delete('/profile/education/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Check if education exists and belongs to the user
    const existingEducation = await prismaClient.education.findUnique({
      where: { id }
    });
    
    if (!existingEducation) {
      return res.status(404).json({ error: 'Education not found' });
    }
    
    if (existingEducation.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this education' });
    }
    
    await prismaClient.education.delete({
      where: { id }
    });
    
    return res.json({ message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    return res.status(500).json({ error: 'Failed to delete education' });
  }
});

// Add experience to user profile
router.post('/profile/experience', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, company, startDate, endDate, current, description } = req.body;
    
    console.log('Experience request received with data:', req.body);
    
    // Basic validation
    if (!title || !company || !startDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    
    // Prepare a safe description value - ensure it's never null or undefined
    const safeDescription = typeof description === 'string' ? description : 'No description provided';
    
    // Create data object with safe values for the database
    // NOTE: Do NOT include location as it doesn't exist in the database schema
    const data = {
      position: title, // Map title to position (database schema field)
      company, 
      description: safeDescription,
      startDate: new Date(startDate),
      endDate: current === true ? null : (endDate ? new Date(endDate) : null),
      userId
    };
    
    console.log('Creating experience record with data:', data);
    
    // Create the database record
    const experience = await prismaClient.experience.create({ data });
    
    console.log('Experience record created successfully:', experience);
    
    // Transform for frontend
    const responseData = {
      ...experience,
      title: experience.position, // Map position back to title
      current: !experience.endDate, // Calculate current from endDate
      location: req.body.location || '', // Add this for frontend compatibility
    };
    
    return res.status(201).json(responseData);
  } catch (error) {
    console.error('Error adding experience:', error);
    return res.status(500).json({ error: 'Failed to add experience: ' + error.message });
  }
});

// Update experience
router.put('/profile/experience/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, company, startDate, endDate, current, description } = req.body;
    
    console.log('Experience update received:', req.body);
    
    // Check if experience exists and belongs to the user
    const existingExperience = await prismaClient.experience.findUnique({
      where: { id }
    });
    
    if (!existingExperience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    if (existingExperience.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this experience' });
    }
    
    // Prepare a safe description value
    const safeDescription = typeof description === 'string' ? description : 'No description provided';
    
    // Update experience with safe data
    // NOTE: Do NOT include location as it doesn't exist in the database schema
    const updatedExperience = await prismaClient.experience.update({
      where: { id },
      data: {
        position: title, // Map title to position
        company,
        description: safeDescription,
        startDate: new Date(startDate),
        endDate: current === true ? null : (endDate ? new Date(endDate) : null),
      }
    });
    
    console.log('Experience updated successfully:', updatedExperience);
    
    // Transform for frontend
    const responseData = {
      ...updatedExperience,
      title: updatedExperience.position, // Map position back to title
      current: !updatedExperience.endDate, // Calculate current from endDate
      location: req.body.location || '', // Add this for frontend compatibility
    };
    
    return res.json(responseData);
  } catch (error) {
    console.error('Error updating experience:', error);
    return res.status(500).json({ error: 'Failed to update experience: ' + error.message });
  }
});

// Delete experience
router.delete('/profile/experience/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Check if experience exists and belongs to the user
    const existingExperience = await prismaClient.experience.findUnique({
      where: { id }
    });
    
    if (!existingExperience) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    if (existingExperience.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this experience' });
    }
    
    await prismaClient.experience.delete({
      where: { id }
    });
    
    return res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Error deleting experience:', error);
    return res.status(500).json({ error: 'Failed to delete experience' });
  }
});

// Add points to a user
router.post('/points', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, reason, meta } = req.body;
    
    // Validate input
    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }
    
    // Start a transaction to ensure data consistency
    const updatedUser = await prismaClient.$transaction(async (prisma) => {
      // Create a points transaction record
      await prisma.pointsTransaction.create({
        data: {
          userId,
          amount,
          reason,
          meta
        }
      });
      
      // Update user's points
      const user = await prisma.user.update({
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
    });
    
    return res.json(updatedUser);
  } catch (error) {
    console.error('Error adding points:', error);
    return res.status(500).json({ error: 'Failed to add points' });
  }
});

// Get user's points history
router.get('/points/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const history = await prismaClient.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    
    const total = await prismaClient.pointsTransaction.count({
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
  } catch (error) {
    console.error('Error fetching points history:', error);
    return res.status(500).json({ error: 'Failed to fetch points history' });
  }
});

// Get all users who can be assigned as freelancers
router.get('/freelancers', authMiddleware, async (req, res) => {
  try {
    // Get all users with freelancer role or capability
    const usersQuery = `
      SELECT u.id, u.name, u.email, u.profilePicture, 
             COUNT(t.id) as taskCount
      FROM User u
      LEFT JOIN Task t ON u.id = t.freelancerId AND t.isFreelance = 1
      WHERE u.isFreelancer = 1 OR u.role = 'freelancer'
      GROUP BY u.id
      ORDER BY u.name ASC
    `;
    
    const freelancers = await db.raw(usersQuery);
    
    res.json(freelancers);
  } catch (err) {
    console.error('Error fetching freelancers:', err);
    res.status(500).send('Server Error');
  }
});

// Get current user's information
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// Get all users (for chat functionality)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get all users except the current user
    const users = await prismaClient.user.findMany({
      where: {
        id: {
          not: currentUserId // Exclude the current user
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
      orderBy: {
        name: 'asc' // Sort alphabetically by name
      }
    });
    
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add both CommonJS and ES module exports
module.exports = router;
module.exports.default = router;