import express from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/authMiddleware.js';
import * as startupController from '../controllers/startupController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST create startup
router.post('/', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), startupController.createStartup);

// GET all startups (public)
router.get('/', startupController.getAllStartups);

// GET owned startups by user ID
router.get('/owned/:userId', authMiddleware, startupController.getOwnedStartupsByUserId);

// GET my startups
router.get('/my-startups', authMiddleware, startupController.getMyStartups);

// GET startup by ID
router.get('/:id', startupController.getStartupById);

// PUT update startup by ID
router.put('/:id', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), startupController.updateStartup);

// GET roles for a specific startup
router.get('/:startupId/roles', authMiddleware, startupController.getRoles);

// GET members for a specific startup
router.get('/:startupId/members', authMiddleware, startupController.getStartupMembers);

// GET user roles for a specific startup
router.get('/:startupId/user-roles', authMiddleware, startupController.getUserRoles);

// GET joined startups
router.get('/joined-startups', authMiddleware, startupController.getJoinedStartups);

// Public route for startup preview
router.get('/:startupId/public-preview', startupController.publicPreview);

export default router;
