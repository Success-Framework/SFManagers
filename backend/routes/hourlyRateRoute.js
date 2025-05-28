import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import {
  getAllHourlyRates,
  getHourlyRateById,
  createHourlyRate,
  updateHourlyRate,
  deleteHourlyRate
} from '../controllers/hourlyRateController.js';

const router = express.Router();

router.get('/', authMiddleware, getAllHourlyRates);
router.get('/:id', authMiddleware, getHourlyRateById);
router.post('/', authMiddleware, adminMiddleware, createHourlyRate);
router.put('/:id', authMiddleware, adminMiddleware, updateHourlyRate);
router.delete('/:id', authMiddleware, adminMiddleware, deleteHourlyRate);

export default router;
