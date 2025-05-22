import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
// import mysql from 'mysql2';
import { testConnection } from './database.js';
import authRoutes from './routes/authRoute.js';



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
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

app.use('/api/auth', authRoutes); // Use the auth routes


app.get('/', (req, res) => {
  res.send('Hello, World!');
});