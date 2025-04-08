// Direct server runner
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Load environment variables
dotenv.config();

console.log('Starting SFManagers application...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Set up MySQL database URL directly
process.env.MYSQL_DATABASE_URL = "mysql://hdadmin_sfm:25Y7Pwsd6UKEh4kTEsAC@localhost:3306/hdadmin_sfm";

// Import database adapter
const { db, testConnection } = require('./dist/database');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection
testConnection().then((success) => {
  if (!success) {
    console.error('Failed to connect to the database. Exiting...');
    process.exit(1);
  }
  console.log('Database connection successful');
}).catch((error) => {
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
const profileUploadsDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
  console.log('Created profile uploads directory');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Import route modules one by one for debugging
console.log('Loading route modules individually:');

console.log('Loading startupRoutes...');
const startupRoutes = require('./dist/routes/startup.routes');
console.log('startupRoutes:', typeof startupRoutes);

console.log('Loading authRoutes...');
const authRoutes = require('./dist/routes/auth.routes');
console.log('authRoutes:', typeof authRoutes);

console.log('Loading joinRequestRoutes...');
const joinRequestRoutes = require('./dist/routes/join-request.routes');
console.log('joinRequestRoutes:', typeof joinRequestRoutes);

console.log('Loading taskRoutes...');
const taskRoutes = require('./dist/routes/task.routes');
console.log('taskRoutes:', typeof taskRoutes);

console.log('Loading userRoutes...');
const userRoutes = require('./dist/routes/user.routes');
console.log('userRoutes:', typeof userRoutes);

console.log('Loading affiliateRoutes...');
const affiliateRoutes = require('./dist/routes/affiliate.routes').default;
console.log('affiliateRoutes:', typeof affiliateRoutes);

console.log('Loading authMiddleware...');
const authMiddleware = require('./dist/middleware/auth');
console.log('authMiddleware:', typeof authMiddleware);

// Try to load notification routes
console.log('Loading notificationRoutes...');
let notificationRoutes = null;
try {
  notificationRoutes = require('./dist/routes/notification.routes');
  console.log('notificationRoutes:', typeof notificationRoutes);
} catch (err) {
  console.warn('Could not load notification routes:', err.message);
}

// Mount routes one by one
console.log('Mounting routes...');

console.log('Mounting /api/startups');
app.use('/api/startups', startupRoutes);

console.log('Mounting /api/auth');
app.use('/api/auth', authRoutes);

console.log('Mounting /api/join-requests');
app.use('/api/join-requests', joinRequestRoutes);

console.log('Mounting /api/tasks');
app.use('/api/tasks', taskRoutes);

console.log('Mounting /api/users');
app.use('/api/users', userRoutes);

console.log('Mounting /api/affiliate');
app.use('/api/affiliate', affiliateRoutes);

// Mount notification routes if available
if (notificationRoutes) {
  console.log('Mounting /api/notifications');
  app.use('/api/notifications', notificationRoutes);
} else {
  console.warn('Notification routes not available, skipping...');
}

// Handle remaining routes that need special access
console.log('Loading and mounting affiliate-links routes...');
try {
  const affiliateLinksRoutes = require('./dist/routes/affiliate-links.routes');
  console.log('affiliateLinksRoutes:', typeof affiliateLinksRoutes);
  app.use('/api/affiliate-links', affiliateLinksRoutes);
} catch (err) {
  console.warn('Could not load affiliate-links routes:', err.message);
}

console.log('Loading and mounting affiliate-clicks routes...');
try {
  const affiliateClicksRoutes = require('./dist/routes/affiliate-clicks.routes');
  console.log('affiliateClicksRoutes:', typeof affiliateClicksRoutes);
  app.use('/api/affiliate-clicks', affiliateClicksRoutes);
} catch (err) {
  console.warn('Could not load affiliate-clicks routes:', err.message);
}

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
  if (fs.existsSync(clientBuildPath)) {
    console.log(`Frontend available at: http://localhost:${PORT}`);
  } else {
    console.log('Frontend not found. Run npm run build first.');
  }
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