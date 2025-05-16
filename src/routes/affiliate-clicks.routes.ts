import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../database';
import authMiddleware from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

interface AffiliateLink {
  id: string;
  name?: string;
  code: string;
  startupId: string;
  userId: string;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt?: string;
}

interface AffiliateClick {
  id: string;
  linkId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  converted?: boolean;
  createdAt: string;
}

// Get clicks for a specific affiliate link
router.get('/:linkId', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { linkId } = req.params;
    const { timeRange } = req.query;
    
    // Get the affiliate link to verify it exists and check permissions
    const link = await db.findOne('AffiliateLink', { id: linkId });
    
    if (!link) {
      res.status(404).json({ error: 'Affiliate link not found' });
      return;
    }
    
    // Check if user is authorized to view this link's data
    // Either they own the link or they are a member of the startup
    const isOwner = link.userId === req.user.id;
    const isMember = await db.findOne('StartupMember', { 
      startupId: link.startupId, 
      userId: req.user.id 
    });
    
    if (!isOwner && !isMember) {
      res.status(403).json({ error: 'Not authorized to view click data for this link' });
      return;
    }
    
    // Build the query based on timeRange
    let dateFilter = {};
    const now = new Date();
    
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo.toISOString() } };
    } else if (timeRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo.toISOString() } };
    } else if (timeRange === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: yearAgo.toISOString() } };
    }
    
    // Get all clicks for the affiliate link with time filter if specified
    const clicks = await db.findMany('AffiliateClick', { 
      linkId,
      ...dateFilter
    });
    
    res.json(clicks);
  } catch (error) {
    console.error('Error fetching affiliate clicks:', error);
    next(error);
  }
}) as RequestHandler);

// Get all clicks for a startup's affiliate links
router.get('/startup/:startupId', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startupId } = req.params;
    const { timeRange } = req.query;
    
    // Check if user is a member of the startup
    const isMember = await db.findOne('StartupMember', { 
      startupId, 
      userId: req.user.id 
    });
    
    if (!isMember) {
      res.status(403).json({ error: 'Not authorized to view affiliate data for this startup' });
      return;
    }
    
    // Get all affiliate links for this startup
    const links = await db.findMany('AffiliateLink', { startupId }) as any[];
    
    if (!links || links.length === 0) {
      res.json({ links: [], clicks: [] });
      return;
    }
    
    // Build time range filter if needed
    let dateFilter = {};
    const now = new Date();
    
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo.toISOString() } };
    } else if (timeRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo.toISOString() } };
    } else if (timeRange === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: yearAgo.toISOString() } };
    }
    
    // Get all clicks for these links
    const linkIds = links.map(link => link.id);
    
    let allClicks: any[] = [];
    for (const linkId of linkIds) {
      const clicks = await db.findMany('AffiliateClick', { 
        linkId,
        ...dateFilter
      }) as any[];
      
      if (clicks && Array.isArray(clicks)) {
        allClicks = [...allClicks, ...clicks];
      }
    }
    
    res.json({ 
      links,
      clicks: allClicks
    });
  } catch (error) {
    console.error('Error fetching startup affiliate data:', error);
    next(error);
  }
}) as RequestHandler);

export default router; 