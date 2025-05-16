const express = require('express');
const router = express.Router();
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Get all hourly rates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = `SELECT * FROM HourlyRateConfig ORDER BY skillType ASC`;
    const rates = await db.raw(query);
    res.json(rates);
  } catch (err) {
    console.error('Error fetching hourly rates:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a specific hourly rate by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const rate = await db.findOne('HourlyRateConfig', { id });
    
    if (!rate) {
      return res.status(404).json({ message: 'Hourly rate configuration not found' });
    }
    
    res.json(rate);
  } catch (err) {
    console.error('Error fetching hourly rate:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new hourly rate (admin only)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { skillType, hourlyRate, description } = req.body;
    
    // Validate required fields
    if (!skillType || !hourlyRate) {
      return res.status(400).json({ message: 'Skill type and hourly rate are required' });
    }
    
    // Create new rate
    const id = require('uuid').v4();
    const newRate = {
      id,
      skillType,
      hourlyRate,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.create('HourlyRateConfig', newRate);
    res.status(201).json(newRate);
  } catch (err) {
    console.error('Error creating hourly rate:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an hourly rate (admin only)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    const { skillType, hourlyRate, description } = req.body;
    
    // Check if rate exists
    const existingRate = await db.findOne('HourlyRateConfig', { id });
    if (!existingRate) {
      return res.status(404).json({ message: 'Hourly rate configuration not found' });
    }
    
    // Update the rate
    const updatedRate = {
      skillType: skillType || existingRate.skillType,
      hourlyRate: hourlyRate || existingRate.hourlyRate,
      description: description !== undefined ? description : existingRate.description,
      updatedAt: new Date()
    };
    
    await db.update('HourlyRateConfig', { id }, updatedRate);
    
    res.json({ ...existingRate, ...updatedRate });
  } catch (err) {
    console.error('Error updating hourly rate:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete an hourly rate (admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if rate exists
    const existingRate = await db.findOne('HourlyRateConfig', { id });
    if (!existingRate) {
      return res.status(404).json({ message: 'Hourly rate configuration not found' });
    }
    
    await db.delete('HourlyRateConfig', { id });
    res.json({ message: 'Hourly rate configuration deleted successfully' });
  } catch (err) {
    console.error('Error deleting hourly rate:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 