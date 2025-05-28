import { db } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

// Get all hourly rates
export const getAllHourlyRates = async (req, res) => {
  try {
    const query = 'SELECT * FROM HourlyRateConfig ORDER BY skillType ASC';
    const rates = await db.raw(query);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching hourly rates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get hourly rate by ID
export const getHourlyRateById = async (req, res) => {
  try {
    const { id } = req.params;
    const rate = await db.findOne('HourlyRateConfig', { id });

    if (!rate) {
      res.status(404).json({ message: 'Hourly rate configuration not found' });
      return;
    }

    res.json(rate);
  } catch (error) {
    console.error('Error fetching hourly rate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new hourly rate
export const createHourlyRate = async (req, res) => {
  try {
    const { skillType, hourlyRate, description } = req.body;

    if (!skillType || !hourlyRate) {
      res.status(400).json({ message: 'Skill type and hourly rate are required' });
      return;
    }

    const id = uuidv4();
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
  } catch (error) {
    console.error('Error creating hourly rate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an existing hourly rate
export const updateHourlyRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { skillType, hourlyRate, description } = req.body;

    const existingRate = await db.findOne('HourlyRateConfig', { id });
    if (!existingRate) {
      res.status(404).json({ message: 'Hourly rate configuration not found' });
      return;
    }

    const updatedRate = {
      skillType: skillType ?? existingRate.skillType,
      hourlyRate: hourlyRate ?? existingRate.hourlyRate,
      description: description ?? existingRate.description,
      updatedAt: new Date()
    };

    await db.update('HourlyRateConfig', { id }, updatedRate);
    res.json({ ...existingRate, ...updatedRate });
  } catch (error) {
    console.error('Error updating hourly rate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an hourly rate
export const deleteHourlyRate = async (req, res) => {
  try {
    const { id } = req.params;
    const existingRate = await db.findOne('HourlyRateConfig', { id });

    if (!existingRate) {
      res.status(404).json({ message: 'Hourly rate configuration not found' });
      return;
    }

    await db.delete('HourlyRateConfig', { id });
    res.json({ message: 'Hourly rate configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting hourly rate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
