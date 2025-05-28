import jwt from 'jsonwebtoken';
// import prisma from '../prisma'; // Uncomment if needed
import { db } from '../database.js'; // Ensure the correct file extension is used

// Define the authentication middleware
const authMiddleware = async function(req, res, next) {
  try {
    // Get token from header (check both x-auth-token and Authorization)
    const token = req.headers['x-auth-token'] || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                   ? req.headers.authorization.split(' ')[1] 
                   : null);
    
    console.log('Auth middleware:', {
      path: req.path,
      method: req.method,
      hasToken: !!token,
      tokenLength: token?.length,
      xAuthToken: !!req.headers['x-auth-token'],
      authorization: !!req.headers.authorization
    });

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not set in environment variables');
      return res.status(500).json({ msg: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);

    // Get user ID from token (handle both old and new token formats)
    const userId = decoded.userId || (decoded.user && decoded.user.id);

    if (!userId) {
      console.log('No user ID in token');
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    // Check if user exists
    const user = await db.findOne('User', { id: userId });

    if (!user) {
      console.log('User not found:', userId);
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    // Get owned startups
    const ownedStartups = await db.findMany('Startup', { ownerId: user.id });

    // Get joined roles with startup info
    const joinedRolesQuery = `
      SELECT ur.id, ur.userId, ur.roleId, r.title, r.roleType, s.id as startupId, s.name as startupName
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ?
    `;
    const joinedRoles = await db.raw(joinedRolesQuery, [user.id]);

    // Add user and roles to request object
    req.user = {
      id: user.id,
      email: user.email,
      roles: [
        ...ownedStartups.map(startup => ({
          startupId: startup.id,
          role: 'owner'
        })),
        ...joinedRoles.map(ur => ({
          startupId: ur.startupId,
          role: ur.roleType
        }))
      ]
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Invalid token structure' });
    }
    res.status(401).json({ msg: 'Token is not valid' });
  }
}; 

// Export for ES modules
export default authMiddleware; 