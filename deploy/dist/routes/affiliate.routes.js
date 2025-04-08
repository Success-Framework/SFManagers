"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Affiliate routes for tracking referral links
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authMiddleware = require("../middleware/auth");
const router = express_1.default.Router();
let affiliateClicks = [];
let affiliateLinks = [];
// Data file paths
const dataDir = path_1.default.join(__dirname, '../../data');
const clicksDataFile = path_1.default.join(dataDir, 'affiliateClicks.json');
const linksDataFile = path_1.default.join(dataDir, 'affiliateLinks.json');
// Load data
try {
    // Load clicks
    if (fs_1.default.existsSync(clicksDataFile)) {
        const rawData = fs_1.default.readFileSync(clicksDataFile, 'utf8');
        if (rawData.trim()) {
            affiliateClicks = JSON.parse(rawData);
        }
    }
    else {
        // Create empty file if it doesn't exist
        fs_1.default.writeFileSync(clicksDataFile, JSON.stringify([]));
    }
    // Load links
    if (fs_1.default.existsSync(linksDataFile)) {
        const rawData = fs_1.default.readFileSync(linksDataFile, 'utf8');
        if (rawData.trim()) {
            affiliateLinks = JSON.parse(rawData);
        }
    }
    else {
        // Create empty file if it doesn't exist
        fs_1.default.writeFileSync(linksDataFile, JSON.stringify([]));
    }
}
catch (err) {
    console.error('Error loading affiliate data:', err);
}
// Save data
const saveData = () => {
    try {
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        fs_1.default.writeFileSync(clicksDataFile, JSON.stringify(affiliateClicks, null, 2));
        fs_1.default.writeFileSync(linksDataFile, JSON.stringify(affiliateLinks, null, 2));
    }
    catch (err) {
        console.error('Error saving affiliate data:', err);
    }
};
// Utility to get mock geolocation data for demo purposes
const getMockGeolocation = (ipAddress) => {
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
router.post('/links', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, startupId, userId } = req.body;
        if (!name || !startupId || !userId) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }
        // Create a unique code for the link
        const code = Buffer.from(`${startupId}-${userId}-${Date.now()}`).toString('base64').replace(/[+/=]/g, '').substring(0, 8);
        const newLink = {
            id: (0, uuid_1.v4)(),
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
    }
    catch (error) {
        console.error('Error creating affiliate link:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get all affiliate links for a startup
router.get('/links/:startupId', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startupId } = req.params;
        const links = affiliateLinks.filter(link => link.startupId === startupId);
        res.json(links);
    }
    catch (error) {
        console.error('Error fetching affiliate links:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Delete an affiliate link
router.delete('/links/:id', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        console.error('Error deleting affiliate link:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Track affiliate link click - fix this to use proper express routing
router.post('/track', (req, res) => {
    try {
        const { startupId, referrerId } = req.body;
        if (!startupId || !referrerId) {
            res.status(400).json({ error: 'Missing required parameters' });
            return;
        }
        // Find the link to update click count
        const link = affiliateLinks.find(link => link.startupId === startupId && link.userId === referrerId);
        if (link) {
            link.clicks += 1;
        }
        // Create new click record
        const newClick = {
            id: (0, uuid_1.v4)(),
            linkId: (link === null || link === void 0 ? void 0 : link.id) || 'unknown',
            startupId,
            referrerId,
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'],
            location: getMockGeolocation(req.ip || '127.0.0.1'),
            timestamp: new Date().toISOString()
        };
        // Add to clicks array
        affiliateClicks.push(newClick);
        // Save data
        saveData();
        // Return success
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Error tracking affiliate click:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Get affiliate analytics for a startup
router.get('/analytics/:startupId', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            filteredClicks = filteredClicks.filter(click => new Date(click.timestamp) >= cutoffDate);
        }
        // Get relevant links
        const links = affiliateLinks.filter(link => link.startupId === startupId);
        // Create aggregated stats
        const stats = {
            totalClicks: filteredClicks.length,
            clicksByCountry: {},
            clicksByLink: {},
            clicksByDay: {},
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
    }
    catch (error) {
        console.error('Error fetching affiliate analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get stats for a user's affiliate link for a specific startup
router.get('/stats/:startupId/:userId', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startupId, userId } = req.params;
        // Check if user has access to this startup's stats
        if (req.user.id !== userId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        // Get stats for this user
        const userLinks = affiliateLinks.filter(link => link.startupId === startupId && link.userId === userId);
        const userClicks = affiliateClicks.filter(click => click.startupId === startupId && click.referrerId === userId);
        res.json({
            links: userLinks.length,
            clicks: userClicks.length,
            conversions: 0 // Implement conversion tracking if needed
        });
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Get all affiliate links for members of a startup
router.get('/links/members/:startupId', authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const linksByUser = {};
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
    }
    catch (error) {
        console.error('Error fetching member links:', error);
        res.status(500).json({ error: 'Server error' });
    }
}));
// Fix the UserRole interface usage
const getUserRoleForStartup = (userRoles, startupId) => {
    return userRoles
        .filter(ur => ur.startupId === startupId)
        .map(ur => ur.role)[0] || null;
};
exports.default = router;
