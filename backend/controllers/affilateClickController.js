import { db } from '../database.js';

export const getAffiliateLinkClicks = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { timeRange } = req.query;
    const userId = req.user.id;

    const link = await db.findOne('AffiliateLink', { id: linkId });
    if (!link) return res.status(404).json({ error: 'Affiliate link not found' });

    const isOwner = link.userId === userId;
    const isMember = await db.findOne('StartupMember', {
      startupId: link.startupId,
      userId,
    });

    if (!isOwner && !isMember) {
      return res.status(403).json({ error: 'Not authorized to view this data' });
    }

    const dateFilter = buildTimeFilter(timeRange);
    const clicks = await db.findMany('AffiliateClick', {
      linkId,
      ...dateFilter,
    });

    res.json(clicks);
  } catch (err) {
    console.error('Error fetching affiliate clicks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStartupClicks = async (req, res) => {
  try {
    const { startupId } = req.params;
    const { timeRange } = req.query;
    const userId = req.user.id;

    const isMember = await db.findOne('StartupMember', { startupId, userId });
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to view this data' });
    }

    const links = await db.findMany('AffiliateLink', { startupId });
    if (!links || links.length === 0) {
      return res.json({ links: [], clicks: [] });
    }

    const dateFilter = buildTimeFilter(timeRange);
    const linkIds = links.map(link => link.id);

    let allClicks = [];
    for (const linkId of linkIds) {
      const clicks = await db.findMany('AffiliateClick', {
        linkId,
        ...dateFilter,
      });
      if (clicks && Array.isArray(clicks)) {
        allClicks = [...allClicks, ...clicks];
      }
    }

    res.json({ links, clicks: allClicks });
  } catch (err) {
    console.error('Error fetching startup affiliate data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function
const buildTimeFilter = (range) => {
  const now = new Date();
  let filter = {};

  if (range === 'week') {
    const date = new Date(now.setDate(now.getDate() - 7));
    filter = { createdAt: { $gte: date.toISOString() } };
  } else if (range === 'month') {
    const date = new Date(now.setMonth(now.getMonth() - 1));
    filter = { createdAt: { $gte: date.toISOString() } };
  } else if (range === 'year') {
    const date = new Date(now.setFullYear(now.getFullYear() - 1));
    filter = { createdAt: { $gte: date.toISOString() } };
  }

  return filter;
};
