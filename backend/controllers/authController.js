import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database.js'; // Adjusted import path for database
import { v4 as uuidv4 } from 'uuid';
import { registerSchema, loginSchema } from '../validator/authValidator.js'; // Import the validation schemas
import { z } from 'zod'; // Import zod

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}

// Register a new user
const registerUser = async (req, res) => {
  try {
    // Validate request body against the register schema
    const parsedData = registerSchema.parse(req.body);
    const { name, email, password } = parsedData;

    const existingUser = await db.findOne('User', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const currentDate = new Date();

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

    await db.create('User', userData);
    const user = await db.findOne('User', { id: userId });

    user.ownedStartups = [];
    user.joinedRoles = [];

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    // Validate request body against the login schema
    const parsedData = loginSchema.parse(req.body);
    const { email, password } = parsedData;

    const user = await db.findOne('User', { email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ownedStartups = await db.findMany('Startup', { ownerId: user.id });

    const joinedRolesQuery = `
      SELECT ur.*, r.*, s.* 
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ?
    `;
    const joinedRoles = await db.raw(joinedRolesQuery, [user.id]);

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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.ownedStartups = ownedStartups;
    user.joinedRoles = formattedJoinedRoles;

    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      roles: [
        ...ownedStartups.map(s => ({ startupId: s.id, role: 'owner' })),
        ...formattedJoinedRoles.map(ur => ({ startupId: ur.role.startup.id, role: ur.role.roleType }))
      ]
    }, JWT_SECRET, { expiresIn: '24h' });

    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.findOne('User', { id: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const ownedStartups = await db.findMany('Startup', { ownerId: user.id });

    const joinedRolesQuery = `
      SELECT ur.*, r.*, s.* 
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ?
    `;
    const joinedRoles = await db.raw(joinedRolesQuery, [user.id]);

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

    user.ownedStartups = ownedStartups;
    user.joinedRoles = formattedJoinedRoles;

    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

// Test endpoint for authentication
const testAuth = async (req, res) => {
  try {
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
};

// Add a route to get startups the user has joined through roles
const getJoinedStartups = async (req, res) => {
  try {
    const userId = req.user.id;

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

    return res.json(joinedStartups);
  } catch (error) {
    console.error('Error getting joined startups:', error);
    return res.status(500).json({ error: 'Failed to get joined startups' });
  }
};

export {
  registerUser,
  loginUser,
  getCurrentUser,
  testAuth,
  getJoinedStartups
};

