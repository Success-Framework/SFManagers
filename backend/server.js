import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { testConnection } from './database.js';
import authRoutes from './routes/authRoute.js';
import startupRoutes from './routes/startupRoute.js';
import documentRoutes from './routes/documentRoute.js';
import affiliateRoutes from './routes/affiliateRoute.js';
import affiliateLinkRoutes from './routes/affliateLinkRoute.js';
import affiliateClickRoutes from './routes/affilateClickRoute.js';
import chatRoutes from './routes/chatRoute.js';
import joinRequestRoutes from './routes/joinRequestRoute.js';
import messageRoutes from './routes/messageRoute.js';
import notificationRoutes from './routes/notificationRoute.js';
import profileRoutes from './routes/profileRoutes.js';
import taskRoutes from './routes/taskRoute.js';
import userRoutes from './routes/userRoute.js';
import hourlyRateRoutes from './routes/hourlyRateRoute.js';
import taskTimeRoutes from './routes/taskTimeRoute.js';
import trackerRoutes from './routes/trackerRoute.js';
import screenshotRoutes from './routes/screenshotRoute.js';
import http from 'http';
import { initializeSocket } from './config/socket.js';


dotenv.config();  
const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
const PORT = process.env.PORT || 8888; // changed to 5000

testConnection().then(success => {
    if (!success) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }

    // Start the server after successful database connection
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Unhandled error in database connection:', error);
    process.exit(1);
});

app.use((req, res, next) => {
  req.io = io
  console.log('Origin:', req.headers.origin);
  next();
});

// ✅ Define this BEFORE using it
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:8080',
  'https://sfmanagers.com',
  'https://api.sfmanagers.com',
  'http://api.sfmanagers.com',
  'http://sfmanagers.com'
];

// CORS configuration - must come before any routes
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`CORS blocked origin: ${origin}`);
      // For security, only allow origins in our allowedOrigins list
      return callback(new Error('Not allowed by CORS'), false);
    }
    // For allowed origins, return the specific origin rather than wildcard
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log(`Handling OPTIONS request from: ${origin}`);
  
  // Only set headers for allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, Origin, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Respond with 200
    res.status(200).send();
  } else {
    // For security, don't respond with CORS headers for non-allowed origins
    res.status(403).send('CORS not allowed for this origin');
  }
});


app.use(express.json()); // Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Create uploads directory if it doesn't exist
const uploadsDir = '/var/www/SFManagers/uploads';
const screenshotsDir = '/var/www/SFManagers/uploads/screenshots';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

app.use('/api/tasktime', taskTimeRoutes); // Use the task time routes

app.use('/api/startups', startupRoutes); // Use the startup routes
app.use('/api/auth', authRoutes); // Use the auth routes
app.use('/api/documents', documentRoutes); // Use the document routes
app.use('/api/affiliate', affiliateRoutes); // Use the affiliate routes
app.use('/api/affiliate-links', affiliateLinkRoutes); // Use the affiliate link routes
app.use('/api/affiliate-clicks', affiliateClickRoutes); // Use the affiliate click routes
app.use('/api/chat', chatRoutes); // Use the chat routes
app.use('/api/join-requests', joinRequestRoutes); // Use the join request routes
app.use('/api/messages', messageRoutes); // Use the message routes
app.use('/api/notifications', notificationRoutes); // Use the notification routes
app.use('/api/profiles', profileRoutes); // Use the profile routes
app.use('/api/tasks', taskRoutes); // Use the task routes
app.use('/api/user', userRoutes); // Use the user routes
app.use('/api/hourly-rates', hourlyRateRoutes); // Use the hourly rate routes
app.use('/api/tracker', trackerRoutes); // Use the tracker routes
app.use('/api/screenshots', screenshotRoutes); // Use the screenshot routes

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
