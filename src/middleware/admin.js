const { db } = require('../database');

module.exports = async function(req, res, next) {
  try {
    // Get user from auth middleware
    const userId = req.user.id;
    if (!userId) {
      return res.status(403).json({ message: 'Unauthorized - Admin access required' });
    }
    
    // Get user from database to check if admin
    const user = await db.findOne('User', { id: userId });
    
    // Check for admin permissions (you may need to modify this based on your actual schema)
    // For now, we'll consider a startup owner as an admin
    const ownedStartups = await db.findMany('Startup', { ownerId: userId });
    
    // Determine if user is an admin based on owned startups
    const isAdmin = ownedStartups && ownedStartups.length > 0;
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Unauthorized - Admin access required' });
    }
    
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 