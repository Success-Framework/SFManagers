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

// Get all affiliate links for a startup
router.get('/startups/:startupId/affiliate-links', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the startup
    const isMember = await db.findOne('StartupMember', { startupId, userId });
    if (!isMember) {
      res.status(403).json({ error: 'Not authorized to view affiliate links for this startup' });
      return;
    }

    // Get all affiliate links for the startup
    const links = await db.findMany('AffiliateLink', { startupId });
    res.json(links);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Generate a new affiliate link
router.post('/startups/:startupId/affiliate-links', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the startup
    const isMember = await db.findOne('StartupMember', { startupId, userId });
    if (!isMember) {
      res.status(403).json({ error: 'Not authorized to create affiliate links for this startup' });
      return;
    }

    // Generate a unique code
    const code = uuidv4().substring(0, 8);

    // Create the affiliate link
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
    next(error);
  }
}) as RequestHandler);

// Track affiliate link click
router.post('/affiliate/:code/click', (async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;

    // Find the affiliate link
    const link = await db.findOne('AffiliateLink', { code });
    if (!link) {
      res.status(404).json({ error: 'Invalid affiliate link' });
      return;
    }

    // Increment click count
    await db.update('AffiliateLink', { id: link.id }, {
      clicks: link.clicks + 1,
      updatedAt: new Date().toISOString()
    });

    // Redirect to the startup page
    res.redirect(`/startup/${link.startupId}`);
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// Track affiliate conversion
router.post('/affiliate/:code/convert', authMiddleware, (async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;
    const userId = req.user.id;

    // Find the affiliate link
    const link = await db.findOne('AffiliateLink', { code });
    if (!link) {
      res.status(404).json({ error: 'Invalid affiliate link' });
      return;
    }

    // Check if user is already a member of the startup
    const isMember = await db.findOne('StartupMember', { startupId: link.startupId, userId });
    if (isMember) {
      res.status(400).json({ error: 'User is already a member of this startup' });
      return;
    }
    
    // Create startup membership
    await db.create('StartupMember', {
      id: uuidv4(),
      startupId: link.startupId,
      userId,
      role: 'member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Increment conversion count
    await db.update('AffiliateLink', { id: link.id }, {
      conversions: link.conversions + 1,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Successfully joined startup' });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router;