import { v4 as uuidv4 } from 'uuid';
import { db } from '../database.js';

export const createAffiliateLink = async (req, res) => {
  try {
    const { name, startupId, type } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Link name is required' });
    }

    if (type === 'startup' && !startupId) {
      return res.status(400).json({ error: 'Startup ID is required for startup links' });
    }

    const code = uuidv4().split('-')[0];
    const link = await db.create('AffiliateLink', {
      id: uuidv4(),
      name,
      code,
      startupId: type === 'startup' ? startupId : null,
      userId: req.user.id,
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json(link);
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    res.status(500).json({ error: 'Failed to create affiliate link' });
  }
};

export const getLinkByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const link = await db.findOne('AffiliateLink', { code });

    if (!link) {
      return res.status(404).json({ error: 'Affiliate link not found' });
    }

    res.json(link);
  } catch (error) {
    console.error('Error fetching affiliate link:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate link' });
  }
};

export const trackClick = async (req, res) => {
  try {
    const { code, referrer } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Link code is required' });
    }

    const link = await db.findOne('AffiliateLink', { code });
    if (!link) {
      return res.status(404).json({ error: 'Affiliate link not found' });
    }

    await db.create('AffiliateClick', {
      id: uuidv4(),
      linkId: link.id,
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      referrer,
      createdAt: new Date()
    });

    await db.query(
      'UPDATE AffiliateLink SET clicks = clicks + 1, updatedAt = ? WHERE id = ?',
      [new Date(), link.id]
    );

    res.status(201).json({ success: true, startupId: link.startupId });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
};

export const getUserLinks = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view these links' });
    }

    const links = await db.findMany('AffiliateLink', { userId });
    res.json(links);
  } catch (error) {
    console.error('Error fetching user links:', error);
    res.status(500).json({ error: 'Failed to fetch user links' });
  }
};
