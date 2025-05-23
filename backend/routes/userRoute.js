import express from 'express';
import {
  upload,
  getUserProfile,
  addExperience,
  getFreelancers,
  getCurrentUser,
  getProfiles
} from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// User profile routes
router.get('/profile', authMiddleware, getUserProfile);
router.post('/profile/experience', authMiddleware, addExperience);

// Freelancer routes
router.get('/freelancers', authMiddleware, getFreelancers);

// Current user routes
router.get('/me', authMiddleware, getCurrentUser);

// Public profiles routes
router.get('/profiles', authMiddleware, getProfiles);
router.get('/', authMiddleware, getProfiles); // Alias for /profiles

export default router;