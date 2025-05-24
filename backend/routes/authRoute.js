import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  testAuth,
  getJoinedStartups
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me',authMiddleware,  getCurrentUser);
router.get('/test-auth',authMiddleware,  testAuth);
router.get('/joined-startups',authMiddleware,  getJoinedStartups);

export default router;
