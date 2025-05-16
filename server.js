// Direct server runner
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { db, testConnection, ensureTablesExist } = require('./dist/database');

// Load environment variables from .env file
require('dotenv').config();

console.log('Starting SFManagers application...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Helper function to ensure we have a valid middleware function
const ensureMiddleware = (module) => {
  if (!module) {
    console.error('Middleware is undefined');
    return (req, res, next) => {
      console.error('Invalid middleware used');
      next();
    };
  }
  
  // If it's a function, use it directly
  if (typeof module === 'function') {
    return module;
  }
  // For ES modules that have a default export
  if (module.default && typeof module.default === 'function') {
    return module.default;
  }
  // If it's a router object, it should have a stack property
  if (module.stack || (module.default && module.default.stack)) {
    return module.default || module;
  }
  // Last resort - look for an express Router instance
  if (module.route || (module.default && module.default.route)) {
    return module.default || module;
  }
  
  console.error('Unable to resolve middleware, got:', typeof module);
  return (req, res, next) => {
    console.error('Invalid middleware used');
    next();
  };
};

// Set up MySQL database URL directly
process.env.MYSQL_DATABASE_URL = "mysql://hdadmin_sfm:25Y7Pwsd6UKEh4kTEsAC@localhost:3306/hdadmin_sfm";

// Update Prisma DATABASE_URL as well for compatibility
process.env.DATABASE_URL = process.env.MYSQL_DATABASE_URL;

// Import routes
const startupRoutes = ensureMiddleware(require('./dist/routes/startup.routes'));
const authRoutes = ensureMiddleware(require('./dist/routes/auth.routes'));
const joinRequestRoutes = ensureMiddleware(require('./dist/routes/join-request.routes'));
const taskRoutes = ensureMiddleware(require('./dist/routes/task.routes'));
const userRoutes = ensureMiddleware(require('./dist/routes/user.routes'));
const authMiddleware = ensureMiddleware(require('./dist/middleware/auth'));
const affiliateRoutes = ensureMiddleware(require('./dist/routes/affiliate.routes'));
const affiliateLinksRoutes = ensureMiddleware(require('./dist/routes/affiliate-links.routes'));
const affiliateClicksRoutes = ensureMiddleware(require('./dist/routes/affiliate-clicks.routes'));
const notificationRoutes = ensureMiddleware(require('./dist/routes/notification.routes'));
const hourlyRatesRoutes = ensureMiddleware(require('./dist/routes/hourly-rates.routes'));
const adminRoutes = ensureMiddleware(require('./dist/routes/admin.routes'));
const documentRoutes = ensureMiddleware(require('./dist/routes/document.routes'));
const chatRoutes = ensureMiddleware(require('./dist/routes/chat.routes'));
const discussionRoutes = ensureMiddleware(require('./dist/routes/discussion.routes'));
const ideaRoutes = require('./src/routes/idea.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection
testConnection().then(success => {
  if (!success) {
    console.error('Failed to connect to the database. Exiting...');
    process.exit(1);
  }
  
  // Ensure all required tables exist
  console.log('Ensuring all required tables exist...');
  ensureTablesExist().then(tablesCreated => {
    if (tablesCreated) {
      console.log('All required tables are available');
      
      // Run idea tables migration
      try {
        const ideaMigrations = require('./src/database/migrate-tables');
        if (ideaMigrations && typeof ideaMigrations.migrateIdeaTables === 'function') {
          ideaMigrations.migrateIdeaTables()
            .then(() => console.log('Idea tables migration completed'))
            .catch(err => {
              console.error('Error with idea tables migration:', err);
              console.log('Continuing server startup despite migration error');
            });
        } else {
          console.log('Idea migration module not found or invalid, skipping migrations');
        }
      } catch (error) {
        console.error('Failed to load idea migrations module:', error.message);
        console.log('Continuing server startup despite migration loading error');
      }
    } else {
      console.warn('Some tables could not be created, but continuing startup');
    }
  }).catch(error => {
    console.error('Error creating tables:', error);
    // Continue anyway - we'll handle missing tables at the API level
  });
}).catch(error => {
  console.error('Unhandled error in database connection:', error);
  process.exit(1);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup CORS for development or use configuration for production
const corsOptions = process.env.NODE_ENV === 'production' 
  ? { origin: process.env.FRONTEND_URL || '*', credentials: true }
  : { origin: 'http://localhost:3000', credentials: true };
app.use(cors(corsOptions));

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, './uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/startups', startupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/affiliate-links', affiliateLinksRoutes);
app.use('/api/affiliate-clicks', affiliateClicksRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hourly-rates', hourlyRatesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Mount discussion routes directly (similar to message functionality)
app.use('/api/startups/:startup_id/discussions', discussionRoutes);

// Mount idea routes directly (this is the safest approach)
app.use('/api/startups/:startupId/ideas', ideaRoutes);

// Determine the frontend build path
const clientBuildPath = path.resolve(__dirname, './dist/client');

// Log the client build path for debugging
console.log('Client build path:', clientBuildPath);

// Always serve static files from the client build directory
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  
  // Handle client-side routing for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error('index.html not found at:', indexPath);
      res.status(404).send('Frontend not built. Run npm run build first.');
    }
  });
}

// API route to fetch members for a startup with their roles
app.get('/api/startups/:startupId/members-with-roles', ensureMiddleware(authMiddleware), async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Get all roles for the startup
    const roles = await db.findMany('Role', { startupId });
    
    // Get all members for the startup
    const members = await db.findMany('StartupMember', { startupId });
    
    // Get user details for each member
    const membersWithDetails = await Promise.all(members.map(async (member) => {
      const user = await db.findOne('User', { id: member.userId });
      const memberRoles = roles.filter(role => 
        role.users && role.users.some(u => u.id === member.userId)
      );
      
      return {
        ...member,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        roles: memberRoles
      };
    }));
    
    res.json(membersWithDetails);
  } catch (err) {
    console.error('Error fetching members with roles:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// API route to get all roles for a startup
app.get('/api/startups/:startupId/roles', ensureMiddleware(authMiddleware), async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Get all roles for this startup
    const roles = await db.findMany('Role', { startupId });
    
    res.json(roles);
  } catch (error) {
    console.error('Error fetching startup roles:', error);
    res.status(500).json({ error: 'Failed to fetch startup roles' });
  }
});

// Add a simple health endpoint for testing
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sfmanagers-api'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`
    Server is running on port ${PORT}
    Environment: ${process.env.NODE_ENV || 'development'}
    API available at: http://localhost:${PORT}/api
    ${fs.existsSync(clientBuildPath) ? `Frontend available at: http://localhost:${PORT}` : 'Frontend not found. Run npm run build first.'}
  `);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Please close any other instances of the server or try again.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  await db.disconnect();
  process.exit(0);
});