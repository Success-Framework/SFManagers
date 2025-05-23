import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  getStartupAffiliateLinks,
  createStartupAffiliateLink,
  trackAffiliateClick,
  trackAffiliateConversion
} from '../controllers/affiliateController.js';

const router = express.Router();

router.get('/startups/:startupId/affiliate-links', authMiddleware, getStartupAffiliateLinks);
router.post('/startups/:startupId/affiliate-links', authMiddleware, createStartupAffiliateLink);
router.post('/affiliate/:code/click', trackAffiliateClick);
router.post('/affiliate/:code/convert', authMiddleware, trackAffiliateConversion);

export default router;
