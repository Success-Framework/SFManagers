import { v4 as uuidv4 } from 'uuid';
import { db } from '../database.js';

export const getStartupAffiliateLinks = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    const isMember = await db.findOne('StartupMember', { startupId, userId });
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to view affiliate links for this startup' });
    }

    const links = await db.findMany('AffiliateLink', { startupId });
    res.json(links);
  } catch (error) {
    console.error('Error getting affiliate links:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createStartupAffiliateLink = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    const isMember = await db.findOne('StartupMember', { startupId, userId });
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to create affiliate links for this startup' });
    }

    const code = uuidv4().substring(0, 8);

    const link = await db.create('AffiliateLink', {
      id: uuidv4(),
      code,
      startupId,
      userId,
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json(link);
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const trackAffiliateClick = async (req, res) => {
  try {
    const { code } = req.params;

    const link = await db.findOne('AffiliateLink', { code });
    if (!link) {
      return res.status(404).json({ error: 'Invalid affiliate link' });
    }

    await db.update('AffiliateLink', { id: link.id }, {
      clicks: link.clicks + 1,
      updatedAt: new Date().toISOString()
    });

    res.redirect(`/startup/${link.startupId}`);
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const trackAffiliateConversion = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.id;

    const link = await db.findOne('AffiliateLink', { code });
    if (!link) {
      return res.status(404).json({ error: 'Invalid affiliate link' });
    }

    const isMember = await db.findOne('StartupMember', { startupId: link.startupId, userId });
    if (isMember) {
      return res.status(400).json({ error: 'User is already a member of this startup' });
    }

    await db.create('StartupMember', {
      id: uuidv4(),
      startupId: link.startupId,
      userId,
      role: 'member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await db.update('AffiliateLink', { id: link.id }, {
      conversions: link.conversions + 1,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Successfully joined startup' });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
