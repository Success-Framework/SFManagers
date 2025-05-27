import express from 'express';
import {
  createJoinRequest,
  getStartupJoinRequests,
  getUserJoinRequests,
  updateJoinRequestStatus,
  deleteJoinRequest,
  getReceivedJoinRequests,
  getJoinRequestsStub
} from '../controllers/joinRequestController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createJoinRequest);

router.get('/startup/:startupId', authMiddleware, getStartupJoinRequests);

router.get('/me', authMiddleware, getUserJoinRequests);

router.patch('/:requestId', authMiddleware, updateJoinRequestStatus);

router.put('/:requestId/status', authMiddleware, updateJoinRequestStatus);

router.delete('/:requestId', authMiddleware, deleteJoinRequest);

router.get('/received', authMiddleware, getReceivedJoinRequests);

router.get('/me/stub', authMiddleware, getJoinRequestsStub);

export default router;
