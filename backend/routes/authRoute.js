import express from 'express';
// import authMiddleware from '../middleware/auth.js';
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
router.get('/me',  getCurrentUser);
router.get('/test-auth',  testAuth);
router.get('/joined-startups',  getJoinedStartups);

export default router;
