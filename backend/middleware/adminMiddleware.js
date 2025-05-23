// backend/middleware/adminMiddleware.js
import { db } from '../database.js';

// Middleware to check if the user is an admin
const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming user ID is stored in req.user
    const user = await db.findOne('User', { id: userId });

    const ownedStartups = await db.findMany('Startup', { ownerId: userId });
    
    const isAdmin = ownedStartups && ownedStartups.length > 0;

    if (!isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export default adminMiddleware; // Export the middleware