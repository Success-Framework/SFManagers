import express from 'express';
import { getAllProfiles, getProfileById } from '../controllers/profileController.js';

const router = express.Router();

// Route to get all profiles
router.get('/profiles', getAllProfiles);

// Route to get a profile by ID
router.get('/profiles/:id', getProfileById);

export default router;
