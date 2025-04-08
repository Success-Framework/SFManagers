const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
// const prisma = require('../prisma').default;
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { email: req.body.email });
    const { name, email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      console.log('Registration failed: Missing required fields');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await db.findOne('User', { email });
    
    if (existingUser) {
      console.log('Registration failed: Email already exists:', email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with a UUID
    const userId = uuidv4();
    const currentDate = new Date();
    
    // Create user object with all required fields
    const userData = {
      id: userId,
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      points: 0,
      level: 1,
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    // Create the user with the db helper
    await db.create('User', userData);
    
    // Retrieve the created user to ensure we have all fields
    const user = await db.findOne('User', { id: userId });
    
    console.log('User created successfully:', { id: user.id, email: user.email });
    
    // At this point, the user is brand new, so they don't have any startups or roles yet
    user.ownedStartups = [];
    user.joinedRoles = [];
    
    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Token generated for new user:', { userId: user.id, hasToken: !!token });
    
    // Return user data and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user exists
    console.log('Looking up user:', email);
    const user = await db.findOne('User', { email });
    
    if (!user) {
      console.log('Login failed: User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get related data that Prisma would have included
    const ownedStartups = await db.findMany('Startup', { ownerId: user.id });
    
    // Get joined roles - this is more complex in SQL
    const joinedRolesQuery = `
      SELECT ur.*, r.*, s.* 
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ?
    `;
    const joinedRoles = await db.raw(joinedRolesQuery, [user.id]);
    
    // Transform joined roles to match previous Prisma structure
    const formattedJoinedRoles = joinedRoles.map(row => ({
      id: row.id,
      userId: row.userId,
      roleId: row.roleId,
      startupId: row.startupId,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      role: {
        id: row.roleId,
        title: row.title,
        roleType: row.roleType,
        isOpen: row.isOpen,
        isPaid: row.isPaid,
        startupId: row.startupId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        startup: {
          id: row.startupId,
          name: row.name,
          details: row.details,
          stage: row.stage,
          logo: row.logo,
          banner: row.banner,
          location: row.location,
          industry: row.industry,
          ownerId: row.ownerId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }
      }
    }));
    
    // Add the related data to user object
    user.ownedStartups = ownedStartups;
    user.joinedRoles = formattedJoinedRoles;
    
    // Verify password
    console.log('Verifying password for user:', user.id);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for user:', user.id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create token with consistent claims
    console.log('Creating token for user:', user.id);
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        roles: [
          ...ownedStartups.map(startup => ({
            startupId: startup.id,
            role: 'owner'
          })),
          ...formattedJoinedRoles.map(ur => ({
            startupId: ur.role.startup.id,
            role: ur.role.roleType
          }))
        ]
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Login successful:', {
      userId: user.id,
      hasToken: !!token,
      ownedStartups: ownedStartups.length,
      joinedRoles: formattedJoinedRoles.length
    });
    
    // Return user data and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      error: 'Failed to login',
      details: error.message
    });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching current user data:', userId);
    
    // Find user
    const user = await db.findOne('User', { id: userId });
    
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get related data that Prisma would have included
    const ownedStartups = await db.findMany('Startup', { ownerId: user.id });
    
    // Get joined roles - this is more complex in SQL
    const joinedRolesQuery = `
      SELECT ur.*, r.*, s.* 
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ?
    `;
    const joinedRoles = await db.raw(joinedRolesQuery, [user.id]);
    
    // Transform joined roles to match previous Prisma structure
    const formattedJoinedRoles = joinedRoles.map(row => ({
      id: row.id,
      userId: row.userId,
      roleId: row.roleId,
      startupId: row.startupId,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      role: {
        id: row.roleId,
        title: row.title,
        roleType: row.roleType,
        isOpen: row.isOpen,
        isPaid: row.isPaid,
        startupId: row.startupId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        startup: {
          id: row.startupId,
          name: row.name,
          details: row.details,
          stage: row.stage,
          logo: row.logo,
          banner: row.banner,
          location: row.location,
          industry: row.industry,
          ownerId: row.ownerId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }
      }
    }));
    
    // Add the related data to user object
    user.ownedStartups = ownedStartups;
    user.joinedRoles = formattedJoinedRoles;
    
    console.log('User data fetched:', {
      id: user.id,
      email: user.email,
      ownedStartups: ownedStartups.length,
      joinedRoles: formattedJoinedRoles.length
    });
    
    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Test endpoint for authentication
router.get('/test-auth', authMiddleware, async (req, res) => {
  try {
    // If middleware passes, this will execute
    return res.status(200).json({ 
      message: 'Authentication successful', 
      user: { 
        id: req.user.id,
        email: req.user.email,
        roles: req.user.roles
      }
    });
  } catch (error) {
    console.error('Test auth endpoint error:', error);
    return res.status(500).json({ error: 'Error in test auth endpoint' });
  }
});

// Add a route to get startups the user has joined through roles
router.get('/joined-startups', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all roles the user has been assigned to through user_role table with SQL
    const joinedStartupsQuery = `
      SELECT DISTINCT s.id, s.name, s.details, s.stage, s.logo, s.banner, s.location, 
             s.industry, s.ownerId, s.createdAt, s.updatedAt, r.id as roleId, 
             r.title as roleTitle, r.roleType
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ?
    `;
    
    const joinedStartupsRows = await db.raw(joinedStartupsQuery, [userId]);
    
    // Transform the data for easier consumption in the frontend
    const joinedStartups = joinedStartupsRows.map(row => ({
      id: row.id,
      name: row.name,
      details: row.details,
      stage: row.stage,
      logo: row.logo,
      banner: row.banner,
      location: row.location,
      industry: row.industry,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      role: {
        id: row.roleId,
        title: row.roleTitle,
        roleType: row.roleType
      }
    }));
    
    res.json(joinedStartups);
  } catch (error) {
    console.error('Error getting joined startups:', error);
    res.status(500).json({ error: 'Failed to get joined startups' });
  }
});

module.exports = router; 