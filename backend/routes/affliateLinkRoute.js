import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createAffiliateLink,
  getLinkByCode,
  trackClick,
  getUserLinks
} from '../controllers/affliateLinkController.js';

router.post('/', authMiddleware, createAffiliateLink);
router.get('/:code', getLinkByCode);
router.post('/track', trackClick);
router.get('/user/:userId', authMiddleware, getUserLinks);

export default router;
