import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getAffiliateLinkClicks,
  getStartupClicks,
} from '../controllers/affilateClickController.js';

const router = express.Router();

router.get('/:linkId', authMiddleware, getAffiliateLinkClicks);
router.get('/startup/:startupId', authMiddleware, getStartupClicks);

export default router;
