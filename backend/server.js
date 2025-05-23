import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import { testConnection } from './database.js';
import authRoutes from './routes/authRoute.js';
import startupRoutes from './routes/startupRoute.js';
import documentRoutes from './routes/documentRoute.js';

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
      console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Unhandled error in database connection:', error);
    process.exit(1);
});



// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow only this origin
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));
app.use(express.json()); // Parse JSON bodies

app.use('/api/auth', authRoutes); // Use the auth routes
app.use('/api/startups', startupRoutes); // Use the startup routes
app.use('/api/documents', documentRoutes); // Use the document routes


app.get('/', (req, res) => {
  res.send('Hello, World!');
});