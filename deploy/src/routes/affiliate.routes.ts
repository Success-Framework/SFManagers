// Affiliate routes for tracking referral links
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import authMiddleware = require('../middleware/auth');
import { User, Startup, Role, UserRole } from '../client/types';

const router = express.Router();

// Models
interface AffiliateClick {
  id: string;
  linkId: string;
  startupId: string;
  referrerId: string;
  ipAddress: string;
  userAgent?: string;
  location?: {
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
  timestamp: string;
}

interface AffiliateLink {
  id: string;
  name: string;
  code: string;
  startupId: string;
  userId: string;
  clicks: number;
  conversions: number;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

// Fix UserRole interface issue
interface EnhancedUserRole extends UserRole {
  startupId: string;
}

// Extend User interface to include role
interface ExtendedUser extends User {
  role?: string;
}

// Add user property to the Request interface
declare global {
  namespace Express {
    interface Request {
      user: ExtendedUser;
    }
  }
}

let affiliateClicks: AffiliateClick[] = [];
let affiliateLinks: AffiliateLink[] = [];

// Data file paths
const dataDir = path.join(__dirname, '../../data');
const clicksDataFile = path.join(dataDir, 'affiliateClicks.json');
const linksDataFile = path.join(dataDir, 'affiliateLinks.json');

// Load data
try {
  // Load clicks
  if (fs.existsSync(clicksDataFile)) {
    const rawData = fs.readFileSync(clicksDataFile, 'utf8');
    if (rawData.trim()) {
      affiliateClicks = JSON.parse(rawData);
    }
  } else {
    // Create empty file if it doesn't exist
    fs.writeFileSync(clicksDataFile, JSON.stringify([]));
  }
  
  // Load links
  if (fs.existsSync(linksDataFile)) {
    const rawData = fs.readFileSync(linksDataFile, 'utf8');
    if (rawData.trim()) {
      affiliateLinks = JSON.parse(rawData);
    }
  } else {
    // Create empty file if it doesn't exist
    fs.writeFileSync(linksDataFile, JSON.stringify([]));
  }
} catch (err) {
  console.error('Error loading affiliate data:', err);
}

// Save data
const saveData = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(clicksDataFile, JSON.stringify(affiliateClicks, null, 2));
    fs.writeFileSync(linksDataFile, JSON.stringify(affiliateLinks, null, 2));
  } catch (err) {
    console.error('Error saving affiliate data:', err);
  }
};

// Utility to get mock geolocation data for demo purposes
const getMockGeolocation = (ipAddress: string) => {
  // In a real app, you would use a geolocation API like MaxMind's GeoIP
  // For demo purposes, we'll create mock data
  const countries = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'India', 'Brazil', 'Japan'];
  const cities = ['New York', 'London', 'Toronto', 'Sydney', 'Berlin', 'Paris', 'Mumbai', 'Rio de Janeiro', 'Tokyo'];
  
  // Use the IP address to deterministically choose a location for demo consistency
  const ipSum = ipAddress.split('.').reduce((sum, num) => sum + parseInt(num), 0);
  const countryIndex = ipSum % countries.length;
  
  return {
    country: countries[countryIndex],
    city: cities[countryIndex],
    lat: -90 + (Math.abs(ipSum * 31) % 180),
    lng: -180 + (Math.abs(ipSum * 17) % 360)
  };
};

// Create affiliate link
router.post('/links', authMiddleware, async (req, res) => {
  try {
    const { name, startupId, userId } = req.body;
    
    if (!name || !startupId || !userId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    
    // Create a unique code for the link
    const code = Buffer.from(`${startupId}-${userId}-${Date.now()}`).toString('base64').replace(/[+/=]/g, '').substring(0, 8);
    
    const newLink: AffiliateLink = {
      id: uuidv4(),
      name,
      code,
      startupId,
      userId,
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString()
    };
    
    affiliateLinks.push(newLink);
    saveData();
    
    res.status(201).json(newLink);
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all affiliate links for a startup
router.get('/links/:startupId', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const links = affiliateLinks.filter(link => link.startupId === startupId);
    res.json(links);
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete an affiliate link
router.delete('/links/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const linkIndex = affiliateLinks.findIndex(link => link.id === id);
    
    if (linkIndex === -1) {
      res.status(404).json({ error: 'Affiliate link not found' });
      return;
    }
    
    affiliateLinks.splice(linkIndex, 1);
    saveData();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting affiliate link:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Track affiliate link click - fix this to use proper express routing
router.post('/track', (req, res) => {
  try {
    const { startupId, referrerId } = req.body;
    
    if (!startupId || !referrerId) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    
    // Find the link to update click count
    const link = affiliateLinks.find(link => 
      link.startupId === startupId && link.userId === referrerId
    );
    
    if (link) {
      link.clicks += 1;
    }
    
    // Create new click record
    const newClick: AffiliateClick = {
      id: uuidv4(),
      linkId: link?.id || 'unknown',
      startupId,
      referrerId,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] as string,
      location: getMockGeolocation(req.ip || '127.0.0.1'),
      timestamp: new Date().toISOString()
    };
    
    // Add to clicks array
    affiliateClicks.push(newClick);
    
    // Save data
    saveData();
    
    // Return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get affiliate analytics for a startup
router.get('/analytics/:startupId', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const { timeframe = 'all' } = req.query;
    
    // Filter clicks by timeframe
    let filteredClicks = affiliateClicks.filter(click => click.startupId === startupId);
    
    if (timeframe !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      switch (timeframe) {
        case 'day':
          cutoffDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          cutoffDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          cutoffDate = new Date(0); // Beginning of time
      }
      
      filteredClicks = filteredClicks.filter(click => 
        new Date(click.timestamp) >= cutoffDate
      );
    }
    
    // Get relevant links
    const links = affiliateLinks.filter(link => link.startupId === startupId);
    
    // Create aggregated stats
    const stats = {
      totalClicks: filteredClicks.length,
      clicksByCountry: {} as Record<string, number>,
      clicksByLink: {} as Record<string, number>,
      clicksByDay: {} as Record<string, number>,
    };
    
    // Aggregate stats
    filteredClicks.forEach(click => {
      // By country
      if (click.location && click.location.country) {
        stats.clicksByCountry[click.location.country] = 
          (stats.clicksByCountry[click.location.country] || 0) + 1;
      }
      
      // By link
      if (click.linkId) {
        stats.clicksByLink[click.linkId] = 
          (stats.clicksByLink[click.linkId] || 0) + 1;
      }
      
      // By day
      const day = click.timestamp.split('T')[0];
      stats.clicksByDay[day] = (stats.clicksByDay[day] || 0) + 1;
    });
    
    res.json({
      stats,
      links,
      clicks: filteredClicks
    });
  } catch (error) {
    console.error('Error fetching affiliate analytics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stats for a user's affiliate link for a specific startup
router.get('/stats/:startupId/:userId', authMiddleware, async (req, res) => {
  try {
    const { startupId, userId } = req.params;
    
    // Check if user has access to this startup's stats
    if (req.user.id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    // Get stats for this user
    const userLinks = affiliateLinks.filter(
      link => link.startupId === startupId && link.userId === userId
    );
    
    const userClicks = affiliateClicks.filter(
      click => click.startupId === startupId && click.referrerId === userId
    );
    
    res.json({
      links: userLinks.length,
      clicks: userClicks.length,
      conversions: 0 // Implement conversion tracking if needed
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all affiliate links for members of a startup
router.get('/links/members/:startupId', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    // Check if user has access to this startup's links
    // For simplicity, let's assume any user who is a member of the startup can see all links
    // In a real app, you would check roles
    const isAdmin = req.user.role === 'admin';
    
    // Get all links for this startup
    const startupLinks = affiliateLinks.filter(link => link.startupId === startupId);
    
    // Group links by user
    const linksByUser: Record<string, AffiliateLink[]> = {};
    
    startupLinks.forEach(link => {
      if (!linksByUser[link.userId]) {
        linksByUser[link.userId] = [];
      }
      linksByUser[link.userId].push(link);
    });
    
    // Get total clicks for each user
    const userStats = Object.keys(linksByUser).map(userId => {
      const userLinks = linksByUser[userId];
      const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);
      
      return {
        userId,
        links: userLinks.length,
        clicks: totalClicks,
        // Add user info if available
        user: userLinks[0].user
      };
    });
    
    res.json(userStats);
  } catch (error) {
    console.error('Error fetching member links:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fix the UserRole interface usage
const getUserRoleForStartup = (userRoles: EnhancedUserRole[], startupId: string) => {
  return userRoles
    .filter(ur => ur.startupId === startupId)
    .map(ur => ur.role)[0] || null;
};

export default router;
