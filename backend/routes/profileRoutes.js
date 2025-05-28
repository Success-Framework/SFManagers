import express from 'express';
import { getAllProfiles, getProfileById } from '../controllers/profileController.js';

const router = express.Router();

// Route to get all profiles
router.get('/', getAllProfiles);

// Route to get a profile by ID
router.get('/:id', getProfileById);

export default router;
