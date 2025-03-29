import express, { Request, Response } from 'express';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import JavaScript routes file with proper TypeScript types
// @ts-ignore - Importing JavaScript modules
const startupRoutes = require('./routes/startup.routes.js');
// @ts-ignore - Importing JavaScript modules
const authRoutes = require('./routes/auth.routes.js');
// @ts-ignore - Importing JavaScript modules
const joinRequestRoutes = require('./routes/join-request.routes.js');
// @ts-ignore - Importing JavaScript modules
const taskRoutes = require('./routes/task.routes.js');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Prisma client
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/startups', startupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/tasks', taskRoutes);

// In production, serve the React build files
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React client's build folder
  app.use(express.static(path.join(__dirname, '../dist/client')));

  // For any other route, send the React app's HTML
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../dist/client', 'index.html'));
  });
} else {
  // In development mode, serve the static files from dist/client
  app.use(express.static(path.join(__dirname, '../dist/client')));
  
  // For any route that doesn't start with /api, serve the React app
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/client', 'index.html'));
    }
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
}); 