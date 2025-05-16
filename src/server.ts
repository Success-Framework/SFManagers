import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import config from './config/production';
// import prisma from './prisma'; // Remove Prisma import
import { db, testConnection } from './database'; // Import MySQL database adapter
import affiliateRoutes from './routes/affiliate.routes';

// Load environment variables
dotenv.config();

// Import routes
const startupRoutes = require('./routes/startup.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const joinRequestRoutes = require('./routes/join-request.routes.js');
const taskRoutes = require('./routes/task.routes.js');
const userRoutes = require('./routes/user.routes.js');
import documentRoutes from './routes/document.routes';
const hourlyRatesRoutes = require('./routes/hourly-rates.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const authMiddleware = require('./middleware/auth.js');
const notificationRoutes = require('./routes/notification.routes.js');
const messageRoutes = require('./routes/message.routes.js');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Test database connection
testConnection().then((success) => {
  if (!success) {
    console.error('Failed to connect to the database. Exiting...');
    process.exit(1);
  }
}).catch((error: any) => {
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
const uploadsDir = path.join(__dirname, '../uploads');
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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/startups', startupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/affiliate', affiliateRoutes);

// Direct message endpoints to bypass router issues
app.get('/api/messages/test', (req, res) => {
  res.json({ message: 'Message test endpoint is working' });
});

app.get('/api/messages/test-direct', (req, res) => {
  res.json({ message: 'Message test-direct endpoint is working' });
});

app.get('/api/messages/unread-count', authMiddleware, async (req: any, res: Response) => {
  try {
    console.log('Direct unread count for user:', req.user.id);
    // Return 0 count for now to avoid errors
    res.json({ unreadCount: 0 });
  } catch (error) {
    console.error('Error in direct unread count:', error);
    res.json({ unreadCount: 0 });
  }
});

app.get('/api/messages/inbox', authMiddleware, async (req: any, res: Response) => {
  try {
    console.log('Direct inbox for user:', req.user.id);
    // Return empty array for now
    res.json([]);
  } catch (error) {
    console.error('Error in direct inbox:', error);
    res.json([]);
  }
});

// Register message router as fallback
try {
  app.use('/api/messages', messageRoutes);
  console.log('Message routes registered successfully');
} catch (error) {
  console.error('Failed to register message routes:', error);
}

app.use('/api/notifications', notificationRoutes);
app.use('/api/hourly-rates', hourlyRatesRoutes);
app.use('/api/admin', adminRoutes);

// Define types for members and roles
interface Member {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    title: string;
    roleType: string;
  };
}

// API route to fetch members for a startup with their roles
app.get('/api/startups/:startupId/members-with-roles', authMiddleware, async (req: any, res: Response): Promise<any> => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Get all members with their roles using a SQL join
    const membersResult = await db.raw(`
      SELECT ur.id as userRoleId, u.id, u.name, u.email, r.id as roleId, r.title, r.roleType
      FROM UserRole ur
      JOIN User u ON ur.userId = u.id
      JOIN Role r ON ur.roleId = r.id
      WHERE r.startupId = ?
    `, [startupId]);
    
    // Check if membersResult is an array before using map
    const members = Array.isArray(membersResult) ? membersResult : [];
    
    // Transform data
    const transformedMembers: Member[] = members.map((ur: any) => ({
      id: ur.id,
      name: ur.name,
      email: ur.email,
      role: {
        id: ur.roleId,
        title: ur.title,
        roleType: ur.roleType
      }
    }));
    
    // Add owner if not already included
    const owner = await db.findOne('User', { id: startup.ownerId });
    
    if (owner && !transformedMembers.some((m: Member) => m.id === owner.id)) {
      transformedMembers.push({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: {
          id: 'owner',
          title: 'Founder',
          roleType: 'Admin'
        }
      });
    }
    
    res.json(transformedMembers);
  } catch (error) {
    console.error('Error fetching startup members:', error);
    res.status(500).json({ error: 'Failed to fetch startup members' });
  }
});

// API route to get all roles for a startup
app.get('/api/startups/:startupId/roles', authMiddleware, async (req: any, res: Response): Promise<any> => {
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

// Determine the frontend build path based on environment
const clientBuildPath = path.resolve(__dirname, process.env.NODE_ENV === 'production' 
  ? '../dist/client' 
  : '../../dist/client');

// Log the client build path for debugging
console.log('Client build path:', clientBuildPath);

// Always serve static files from the client build directory
if (fs.existsSync(clientBuildPath)) {
  // Configure caching for static assets but not for HTML files
  app.use(express.static(clientBuildPath, {
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Set caching headers for all static files except index.html
      if (!path.endsWith('.html')) {
        // Cache static assets for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400');
      } else {
        // Ensure HTML is not cached to avoid routing issues
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));
  
  // Handle client-side routing for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes and file uploads
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      // Always serve index.html with no-cache headers for SPA routes
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
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
}).on('error', (err: any) => {
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

// Export database client for use in routes