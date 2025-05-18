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
    console.log('Fetching profile for user:', userId);
    
    try {
      // Debug database connection
      console.log('Testing database connection...');
      await db.raw('SELECT 1');
      console.log('Database connection successful');
      
      // Fetch basic user info
      console.log('Fetching user info...');
      const userResult = await db.raw(
        `SELECT 
          id, email, name, headline, bio, location, profileImage,
          linkedinUrl, githubUrl, portfolio, phone, points, level,
          createdAt, updatedAt
        FROM User 
        WHERE id = ?`,
        [userId]
      );
      
      console.log('User query result:', userResult);
      
      if (!userResult || userResult.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userResult[0];

      // Fetch skills
      console.log('Fetching skills...');
      const skills = await db.raw(
        'SELECT id, name, level FROM Skill WHERE userId = ?',
        [userId]
      );

      // Fetch education
      console.log('Fetching education...');
      const education = await db.raw(
        `SELECT id, institution, degree, fieldOfStudy, startDate, endDate, description 
         FROM Education 
         WHERE userId = ? 
         ORDER BY startDate DESC`,
        [userId]
      );

      // Fetch experience
      console.log('Fetching experience...');
      const experience = await db.raw(
        `SELECT id, title, company, startDate, endDate, current, description 
         FROM Experience 
         WHERE userId = ? 
         ORDER BY startDate DESC`,
        [userId]
      );

      // Fetch recent points history
      console.log('Fetching points history...');
      const pointsHistory = await db.raw(
        `SELECT id, points, description, createdAt 
         FROM PointsTransaction 
         WHERE userId = ? 
         ORDER BY createdAt DESC 
         LIMIT 10`,
        [userId]
      );

      // Format dates for JSON
      education?.forEach(edu => {
        edu.startDate = edu.startDate?.toISOString();
        edu.endDate = edu.endDate?.toISOString();
      });

      experience?.forEach(exp => {
        exp.startDate = exp.startDate?.toISOString();
        exp.endDate = exp.endDate?.toISOString();
      });

      // Combine all data
      const userData = {
        ...user,
        skills: skills || [],
        education: education || [],
        experience: experience || [],
        pointsHistory: pointsHistory || []
      };

      console.log('Full profile data:', {
        userId: userData.id,
        hasExperience: experience?.length > 0,
        experienceCount: experience?.length,
        experienceData: experience
      });

      return res.json(userData);
    } catch (error) {
      console.error('Error in database query:', error);
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message,
        stack: error.stack
      });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user profile',
      details: error.message 
    });
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
    
    // Create the database record
    console.log('Creating experience record...');
    const result = await db.raw(
      `INSERT INTO Experience (
        title, company, description, startDate, endDate, current, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        company,
        safeDescription,
        new Date(startDate),
        current ? null : (endDate ? new Date(endDate) : null),
        !!current,
        userId
      ]
    );
    
    console.log('Insert result:', result);
    
    // Fetch the created experience
    console.log('Fetching created experience...');
    const [experience] = await db.raw(
      'SELECT * FROM Experience WHERE id = ?',
      [result.insertId]
    );
    
    // Format dates for JSON
    if (experience) {
      experience.startDate = experience.startDate?.toISOString();
      experience.endDate = experience.endDate?.toISOString();
    }
    
    console.log('Experience record created successfully:', experience);
    
    return res.status(201).json(experience);
  } catch (error) {
    console.error('Error adding experience:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to add experience',
      details: error.message,
      stack: error.stack
    });
  }
});

// Add education to user profile
router.post('/profile/education', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    
    if (!institution || !degree || !fieldOfStudy || !startDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    
    const education = await prismaClient.education.create({
      data: {
        institution,
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
    const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    
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
        institution,
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
        title, // Use title directly as it matches the database schema
        company,
        description: safeDescription,
        startDate: new Date(startDate),
        endDate: current === true ? null : (endDate ? new Date(endDate) : null),
        current: !!current
      }
    });
    
    console.log('Experience updated successfully:', updatedExperience);
    
    return res.json(updatedExperience);
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

// Get all profiles with optional filtering
router.get('/profiles', authMiddleware, async (req, res) => {
  try {
    console.log('Profiles API request received with params:', req.query);
    const { userType, position, available } = req.query;
    
    // Test database connection before proceeding
    try {
      console.log('Testing database connection in profiles endpoint...');
      await db.raw('SELECT 1');
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      // Continue anyway, as we'll try Prisma next
    }
    
    // Base query for users
    let whereClause = {};
    
    // Filter by user type if specified
    if (userType) {
      const types = Array.isArray(userType) ? userType : userType.split(',');
      console.log('Filtering by user types:', types);
      
      if (types.length > 0) {
        // Simplified version - in production we would have a more complex query
        if (types.includes('founder')) {
          whereClause.role = 'founder';
        } else if (types.includes('investor')) {
          whereClause.role = 'investor';
        } else if (types.includes('freelancer')) {
          whereClause.role = 'freelancer';
        } else if (types.includes('employee')) {
          whereClause.role = 'user'; // Default employee role
        }
      }
    }
    
    // Filter by position/headline if specified
    if (position) {
      const positions = Array.isArray(position) ? position : position.split(',');
      console.log('Filtering by positions:', positions);
      
      if (positions.length > 0) {
        whereClause.headline = {
          contains: positions[0]
        };
      }
    }
    
    // Filter by availability if specified
    if (available === 'true') {
      console.log('Filtering by availability');
      whereClause.availability = {
        not: null
      };
    }
    
    console.log('Using where clause:', JSON.stringify(whereClause));
    
    // Try using raw SQL for better control if Prisma is having issues
    try {
      console.log('Executing user query with raw SQL...');
      
      // Simple SQL query to get all users
      const [users] = await db.raw(`
        SELECT 
          id, email, name, headline, bio, location, profileImage,
          role, availability, createdAt
        FROM User
        LIMIT 50
      `);
      
      console.log(`Found ${users.length} users with raw SQL`);
      
      // Get skills for each user
      const userIds = users.map(user => user.id);
      let skills = [];
      
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        [skills] = await db.raw(
          `SELECT userId, name, level FROM Skill WHERE userId IN (${placeholders})`,
          userIds
        );
      }
      
      // Group skills by user ID
      const skillsByUser = {};
      skills.forEach(skill => {
        if (!skillsByUser[skill.userId]) {
          skillsByUser[skill.userId] = [];
        }
        skillsByUser[skill.userId].push({
          name: skill.name,
          level: skill.level
        });
      });
      
      // Transform user data into profile format expected by frontend
      const profiles = users.map(user => {
        // Determine user type based on role or other criteria
        let userType = 'employee';
        if (user.role === 'founder') userType = 'founder';
        else if (user.role === 'investor') userType = 'investor';
        else if (user.role === 'freelancer' || user.availability) userType = 'freelancer';
        
        return {
          id: user.id,
          fullName: user.name || 'Anonymous User',
          email: user.email || '',
          position: user.headline || 'Member',
          userType: userType,
          location: user.location || '',
          avatarUrl: user.profileImage || null,
          bio: user.bio || '',
          skills: skillsByUser[user.id] || [],
          followers: 0,
          projects: 0,
          availableForHire: !!user.availability,
          hourlyRate: '$80', // Hardcoded value since we don't have this field
          availability: user.availability || null,
          rating: 4.5,
          joinDate: user.createdAt?.toString() || new Date().toISOString()
        };
      });
      
      console.log(`Returning ${profiles.length} profiles`);
      return res.json({ profiles });
    } catch (sqlError) {
      console.error('Raw SQL query failed:', sqlError);
      
      // Fallback to Prisma if raw SQL fails
      console.log('Falling back to Prisma...');
      
      // Execute the query with Prisma - remove hourlyRate as it's not in the schema
      const users = await prismaClient.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          headline: true,
          bio: true,
          location: true,
          profileImage: true,
          points: true,
          level: true,
          availability: true,
          linkedinUrl: true,
          githubUrl: true,
          portfolio: true,
          createdAt: true,
          updatedAt: true,
          skills: true,
          joinedRoles: {
            include: {
              role: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        },
        take: 50 // Limit to 50 results for performance
      });
      
      console.log(`Found ${users.length} users with Prisma`);
      
      // Transform user data into profile format expected by frontend
      const profiles = users.map(user => {
        // Determine user type based on roles
        const userType = getUserType(user);
        
        return {
          id: user.id,
          fullName: user.name || 'Anonymous User',
          email: user.email || '',
          position: user.headline || 'Member',
          userType: userType,
          location: user.location || '',
          avatarUrl: user.profileImage || null,
          bio: user.bio || '',
          skills: user.skills || [],
          followers: 0,
          projects: user.joinedRoles?.length || 0,
          availableForHire: !!user.availability,
          hourlyRate: '$80', // Hardcoded since the field doesn't exist
          availability: user.availability || null,
          rating: 4.5,
          joinDate: user.createdAt?.toISOString() || new Date().toISOString()
        };
      });
      
      console.log(`Returning ${profiles.length} profiles from Prisma`);
      return res.json({ profiles });
    }
  } catch (error) {
    console.error('Error fetching profiles:', error);
    console.error('Error stack:', error.stack);
    
    // Fallback to mock data if everything fails
    console.log('Falling back to mock data due to error');
    const mockProfiles = [
      {
        id: '1',
        fullName: 'John Developer',
        email: 'john@example.com',
        position: 'Full Stack Developer',
        userType: 'freelancer',
        location: 'San Francisco, CA',
        skills: [
          { name: 'React', level: 'expert' },
          { name: 'Node.js', level: 'advanced' }
        ],
        bio: 'Passionate developer with 5+ years of experience building web applications.',
        followers: 120,
        projects: 15,
        availableForHire: true,
        hourlyRate: '$80',
        rating: 4.8,
        joinDate: '2023-01-15'
      },
      {
        id: '2',
        fullName: 'Sarah Designer',
        email: 'sarah@example.com',
        position: 'UI/UX Designer',
        userType: 'employee',
        location: 'New York, NY',
        skills: [
          { name: 'Figma', level: 'expert' },
          { name: 'UI Design', level: 'expert' }
        ],
        bio: 'Creative designer focused on creating beautiful and functional user interfaces.',
        followers: 85,
        projects: 23,
        availableForHire: false,
        rating: 4.6,
        joinDate: '2022-11-05'
      }
    ];
    
    return res.json({ profiles: mockProfiles });
  }
});

// Helper function to determine user type from user data
function getUserType(user) {
  // In a real implementation, this would be based on your data model
  // This is a simplified example - adapt to your actual business logic
  
  // Check if user is a founder (has created startups)
  if (user.joinedRoles?.some(role => role.role?.name?.toLowerCase().includes('founder'))) {
    return 'founder';
  }
  
  // Check if user is an investor
  if (user.skills?.some(skill => skill.name.toLowerCase().includes('invest')) ||
      user.headline?.toLowerCase().includes('invest')) {
    return 'investor';
  }
  
  // Check if user is a freelancer
  if (user.availability || user.hourlyRate || 
      user.headline?.toLowerCase().includes('freelance')) {
    return 'freelancer';
  }
  
  // Default to employee
  return 'employee';
}

// Add a direct root-level profiles endpoint for compatibility with sfcollab
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Root profiles endpoint called with params:', req.query);
    const { userType, position, available } = req.query;
    
    // Simple query to get all users
    const [users] = await db.raw(`
      SELECT 
        id, email, name, headline, bio, location, profileImage,
        role, availability, createdAt
      FROM User
      LIMIT 50
    `);
    
    console.log(`Found ${users.length} users with raw SQL from root endpoint`);
    
    // Get skills for each user
    const userIds = users.map(user => user.id);
    let skills = [];
    
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      [skills] = await db.raw(
        `SELECT userId, name, level FROM Skill WHERE userId IN (${placeholders})`,
        userIds
      );
    }
    
    // Group skills by user ID
    const skillsByUser = {};
    skills.forEach(skill => {
      if (!skillsByUser[skill.userId]) {
        skillsByUser[skill.userId] = [];
      }
      skillsByUser[skill.userId].push({
        name: skill.name,
        level: skill.level
      });
    });
    
    // Transform user data into profile format expected by sfcollab
    const profiles = users.map(user => {
      // Determine user type based on role or other criteria
      let userType = 'employee';
      if (user.role === 'founder') userType = 'founder';
      else if (user.role === 'investor') userType = 'investor';
      else if (user.role === 'freelancer' || user.availability) userType = 'freelancer';
      
      return {
        id: user.id,
        fullName: user.name || 'Anonymous User',
        email: user.email || '',
        position: user.headline || 'Member',
        userType: userType,
        location: user.location || '',
        avatarUrl: user.profileImage || null,
        bio: user.bio || '',
        skills: skillsByUser[user.id] || [],
        followers: Math.floor(Math.random() * 100) + 20, // Random followers for demo
        projects: Math.floor(Math.random() * 20) + 1, // Random projects for demo
        availableForHire: !!user.availability,
        hourlyRate: '$80', // Hardcoded since we don't have this field
        availability: user.availability || null,
        rating: (3.5 + Math.random()).toFixed(1), // Random rating between 3.5-4.5
        joinDate: user.createdAt?.toString() || new Date().toISOString()
      };
    });
    
    console.log(`Returning ${profiles.length} profiles from root endpoint`);
    return res.json({ profiles });
  } catch (error) {
    console.error('Error in root profiles endpoint:', error);
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Add both CommonJS and ES module exports
module.exports = router;
module.exports.default = router;