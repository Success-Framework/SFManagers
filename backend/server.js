import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import bodyParser from 'body-parser';
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

dotenv.config();  
const app = express();
const PORT = process.env.PORT || 8080;

testConnection().then(success => {
    if (!success) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }

    // Start the server after successful database connection
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Unhandled error in database connection:', error);
    process.exit(1);
});

app.use((req, res, next) => {
  console.log('Origin:', req.headers.origin);
  next();
});

// ✅ Define this BEFORE using it
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004'
];

// ✅ Apply CORS middleware with dynamic origin check
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));



app.use(express.json()); // Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

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

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});