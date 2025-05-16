import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import authMiddleware from '../middleware/auth';

interface AuthRequest extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

const router = express.Router();

// Create new affiliate link
router.post('/', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, startupId, type } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Link name is required' });
      return;
    }

    if (type === 'startup' && !startupId) {
      res.status(400).json({ error: 'Startup ID is required for startup links' });
      return;
    }

    // Generate a unique code
    const code = uuidv4().split('-')[0];

    // Create the link
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
    next(error);
  }
}) as RequestHandler);

// Get link details by code
router.get('/:code', (async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;
    
    // Find the link
    const link = await db.findOne('AffiliateLink', { code });
    if (!link) {
      res.status(404).json({ error: 'Affiliate link not found' });
      return;
    }
    
    res.json(link);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Track click - no auth required for tracking clicks
router.post('/track', (async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, referrer } = req.body;
    
    if (!code) {
      res.status(400).json({ error: 'Link code is required' });
      return;
    }
    
    // Find the link
    const link = await db.findOne('AffiliateLink', { code });
    if (!link) {
      res.status(404).json({ error: 'Affiliate link not found' });
      return;
    }
    
    // Record the click
    const click = await db.create('AffiliateClick', {
      id: uuidv4(),
      linkId: link.id,
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'],
      referrer,
      createdAt: new Date()
    });
    
    // Increment click count
    await db.query(
      'UPDATE AffiliateLink SET clicks = clicks + 1, updatedAt = ? WHERE id = ?',
      [new Date(), link.id]
    );
    
    // Return success with startup ID for redirection
    res.status(201).json({ 
      success: true,
      startupId: link.startupId
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Get user's affiliate links
router.get('/user/:userId', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Only allow users to view their own links
    if (req.user.id !== userId) {
      res.status(403).json({ error: 'Not authorized to view these links' });
      return;
    }
    
    // Get all links for the user
    const links = await db.findMany('AffiliateLink', { userId });
    res.json(links);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router; 