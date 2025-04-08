import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h',
  },
  frontend: {
    buildPath: '../dist',
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'https://sfmanagers.com',
    credentials: true,
  },
}; 