const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header (check both x-auth-token and Authorization)
    const token = req.headers['x-auth-token'] || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') 
                   ? req.headers.authorization.split(' ')[1] 
                   : null);
    
    if (!token) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({ error: 'Authentication token is required' });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Find user - support both userId and id fields for backward compatibility
      const userId = decoded.userId || decoded.id;
      
      if (!userId) {
        console.log('Authentication failed: Token missing userId field', decoded);
        return res.status(401).json({ error: 'Invalid token: missing user ID' });
      }
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        console.log(`Authentication failed: User not found with ID: ${userId}`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Add user to request object
      req.user = user;
      
      // Proceed to the next middleware/route handler
      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token structure or signature' });
      }
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      return res.status(401).json({ error: `Token verification failed: ${tokenError.message}` });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authMiddleware; 