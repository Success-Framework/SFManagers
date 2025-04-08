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
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const production_1 = __importDefault(require("./config/production"));
// Load environment variables
dotenv_1.default.config();
// Import JavaScript routes file with proper TypeScript types
// @ts-ignore - Importing JavaScript modules
const startupRoutes = require('./routes/startup.routes.js');
// @ts-ignore - Importing JavaScript modules
const authRoutes = require('./routes/auth.routes.js');
// @ts-ignore - Importing JavaScript modules
const joinRequestRoutes = require('./routes/join-request.routes.js');
// @ts-ignore - Importing JavaScript modules
const taskRoutes = require('./routes/task.routes.js');
// @ts-ignore - Importing JavaScript modules
const userRoutes = require('./routes/user.routes.js');
// @ts-ignore - Importing JavaScript modules
const affiliateRoutes = require('./routes/affiliate.routes.js');
// @ts-ignore - Importing JavaScript modules
const authMiddleware = require('./middleware/auth.js');
// Initialize express app
const app = (0, express_1.default)();
const PORT = production_1.default.port || 3000;
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)(production_1.default.cors));
// Create uploads directories if they don't exist
const uploadsDir = path_1.default.join(__dirname, '../uploads');
const profileUploadsDir = path_1.default.join(uploadsDir, 'profiles');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}
if (!fs_1.default.existsSync(profileUploadsDir)) {
    fs_1.default.mkdirSync(profileUploadsDir, { recursive: true });
    console.log('Created profile uploads directory');
}
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// API Routes
app.use('/api/startups', startupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/affiliate-links', require('./routes/affiliate-links.routes.js'));
app.use('/api/affiliate-clicks', require('./routes/affiliate-clicks.routes.js'));
// Where database variables are defined
let users = [];
let startups = [];
let roles = [];
let joinRequests = [];
let userRoles = [];
let opportunities = [];
let leads = [];
let leadComments = [];
let tasks = [];
// Load data from JSON files
try {
    // Ensure data directory exists - fix the path to be in project root, not src directory
    const dataDir = path_1.default.join(__dirname, '../data');
    console.log('Data directory path:', dataDir);
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory');
    }
    const createEmptyJsonFile = (filename, initialData = []) => {
        const filePath = path_1.default.join(dataDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            fs_1.default.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
            console.log(`Created empty ${filename} file`);
        }
    };
    const readJsonFile = (filename, defaultData = []) => {
        try {
            const filePath = path_1.default.join(dataDir, filename);
            if (fs_1.default.existsSync(filePath)) {
                // Read file as binary first to detect BOM and handle it properly
                const buffer = fs_1.default.readFileSync(filePath);
                let rawData = buffer.toString('utf8');
                // Check and remove UTF-8 BOM if present
                if (rawData.charCodeAt(0) === 0xFEFF) {
                    rawData = rawData.slice(1);
                }
                // Check if data is empty or only whitespace and return default if so
                if (!rawData.trim()) {
                    console.log(`File ${filename} is empty, using default data`);
                    return defaultData;
                }
                try {
                    const parsedData = JSON.parse(rawData);
                    console.log(`Loaded ${filename}, entries:`, Array.isArray(parsedData) ? parsedData.length : 'not an array');
                    return parsedData;
                }
                catch (parseError) {
                    console.error(`Error parsing ${filename}:`, parseError);
                    // Delete and recreate the file with default data to fix corruption
                    try {
                        fs_1.default.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), { encoding: 'utf8' });
                        console.log(`Recreated ${filename} with default data due to parse error`);
                    }
                    catch (writeError) {
                        console.error(`Failed to recreate ${filename}:`, writeError);
                    }
                    return defaultData;
                }
            }
            else {
                createEmptyJsonFile(filename, defaultData);
                return defaultData;
            }
        }
        catch (error) {
            console.error(`Error reading ${filename}:`, error);
            return defaultData;
        }
    };
    // Create all required files if they don't exist
    createEmptyJsonFile('users.json', []);
    createEmptyJsonFile('startups.json', []);
    createEmptyJsonFile('roles.json', []);
    createEmptyJsonFile('joinRequests.json', []);
    createEmptyJsonFile('userRoles.json', []);
    createEmptyJsonFile('opportunities.json', []);
    createEmptyJsonFile('leads.json', []);
    createEmptyJsonFile('leadComments.json', []);
    createEmptyJsonFile('tasks.json', []);
    // Read data from files
    users = readJsonFile('users.json', []);
    startups = readJsonFile('startups.json', []);
    roles = readJsonFile('roles.json', []);
    joinRequests = readJsonFile('joinRequests.json', []);
    userRoles = readJsonFile('userRoles.json', []);
    opportunities = readJsonFile('opportunities.json', []);
    leads = readJsonFile('leads.json', []);
    leadComments = readJsonFile('leadComments.json', []);
    tasks = readJsonFile('tasks.json', []);
}
catch (error) {
    console.error('Error loading data:', error);
}
// Save data function updates
const saveData = () => {
    // Use the correct data directory path
    const dataDir = path_1.default.join(__dirname, '../data');
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    const saveJsonFile = (filename, data) => {
        try {
            const filePath = path_1.default.join(dataDir, filename);
            // Always ensure we're writing clean UTF-8 without BOM
            fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
            console.log(`Successfully saved ${filename}`);
            return true;
        }
        catch (error) {
            console.error(`Error saving ${filename}:`, error);
            return false;
        }
    };
    saveJsonFile('users.json', users);
    saveJsonFile('startups.json', startups);
    saveJsonFile('roles.json', roles);
    saveJsonFile('joinRequests.json', joinRequests);
    saveJsonFile('userRoles.json', userRoles);
    saveJsonFile('opportunities.json', opportunities);
    saveJsonFile('leads.json', leads);
    saveJsonFile('leadComments.json', leadComments);
    saveJsonFile('tasks.json', tasks);
};
// Add the opportunities endpoints
// @ts-ignore
app.get('/api/opportunities', authMiddleware, (req, res) => {
    try {
        const enrichedOpportunities = opportunities.map(opportunity => {
            const startup = startups.find(s => s.id === opportunity.startupId);
            return Object.assign(Object.assign({}, opportunity), { startup: startup ? { id: startup.id, name: startup.name } : undefined });
        });
        res.json(enrichedOpportunities);
    }
    catch (error) {
        res.status(500).send({ msg: 'Error fetching opportunities' });
    }
});
// @ts-ignore
app.get('/api/opportunities/startup/:startupId', authMiddleware, (req, res) => {
    try {
        const { startupId } = req.params;
        const startupOpportunities = opportunities
            .filter(opportunity => opportunity.startupId === startupId)
            .map(opportunity => {
            const startup = startups.find(s => s.id === opportunity.startupId);
            return Object.assign(Object.assign({}, opportunity), { startup: startup ? { id: startup.id, name: startup.name } : undefined });
        });
        res.json(startupOpportunities);
    }
    catch (error) {
        res.status(500).send({ msg: 'Error fetching opportunities for startup' });
    }
});
// @ts-ignore
app.post('/api/opportunities', authMiddleware, (req, res) => {
    try {
        const { startupId, position, experience, description, openings } = req.body;
        // Validate required fields
        if (!startupId || !position || !experience || !description) {
            return res.status(400).send({ msg: 'Required fields missing' });
        }
        // Log for debugging
        console.log('Creating opportunity for startupId:', startupId);
        // Check if user has permission to create an opportunity for this startup
        const userId = req.user.id;
        let startup = startups.find(s => s.id === startupId);
        if (!startup) {
            console.error(`Startup with ID ${startupId} not found. Available startups:`, startups.length);
            console.log('Available startup IDs:', startups.map(s => s.id));
            return res.status(404).send({ msg: 'Startup not found' });
        }
        if (startup.ownerId !== userId) {
            // Check if the user is a manager or admin of the startup
            const userRole = userRoles.find(ur => ur.userId === userId &&
                roles.some(r => r.id === ur.roleId && r.startupId === startupId &&
                    (r.title.toLowerCase().includes('manager') || r.title.toLowerCase().includes('admin'))));
            if (!userRole) {
                return res.status(403).send({ msg: 'You do not have permission to create opportunities for this startup' });
            }
        }
        const newOpportunity = {
            id: (0, uuid_1.v4)(),
            position,
            experience,
            description,
            openings: parseInt(openings) || 1,
            startupId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        opportunities.push(newOpportunity);
        // Save the data
        saveData();
        // Return the created opportunity with startup details
        const createdOpportunity = Object.assign(Object.assign({}, newOpportunity), { startup: { id: startup.id, name: startup.name } });
        console.log('Successfully created opportunity:', newOpportunity.id);
        res.status(201).json(createdOpportunity);
    }
    catch (error) {
        console.error('Error creating opportunity:', error);
        res.status(500).send({ msg: 'Error creating opportunity' });
    }
});
// @ts-ignore
app.put('/api/opportunities/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const { position, experience, description, openings } = req.body;
        const opportunityIndex = opportunities.findIndex(o => o.id === id);
        if (opportunityIndex === -1) {
            return res.status(404).send({ msg: 'Opportunity not found' });
        }
        // Check user permission
        const userId = req.user.id;
        const opportunity = opportunities[opportunityIndex];
        const startup = startups.find(s => s.id === opportunity.startupId);
        if (!startup) {
            return res.status(404).send({ msg: 'Startup not found' });
        }
        if (startup.ownerId !== userId) {
            // Check if the user is a manager or admin of the startup
            const userRole = userRoles.find(ur => ur.userId === userId &&
                roles.some(r => r.id === ur.roleId && r.startupId === opportunity.startupId &&
                    (r.title.toLowerCase().includes('manager') || r.title.toLowerCase().includes('admin'))));
            if (!userRole) {
                return res.status(403).send({ msg: 'You do not have permission to update this opportunity' });
            }
        }
        // Update the opportunity
        opportunities[opportunityIndex] = Object.assign(Object.assign({}, opportunity), { position: position || opportunity.position, experience: experience || opportunity.experience, description: description || opportunity.description, openings: openings ? parseInt(openings) : opportunity.openings, updatedAt: new Date().toISOString() });
        saveData();
        // Return the updated opportunity with startup details
        const updatedOpportunity = Object.assign(Object.assign({}, opportunities[opportunityIndex]), { startup: { id: startup.id, name: startup.name } });
        res.json(updatedOpportunity);
    }
    catch (error) {
        res.status(500).send({ msg: 'Error updating opportunity' });
    }
});
// @ts-ignore
app.delete('/api/opportunities/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const opportunityIndex = opportunities.findIndex(o => o.id === id);
        if (opportunityIndex === -1) {
            return res.status(404).send({ msg: 'Opportunity not found' });
        }
        // Check user permission
        const userId = req.user.id;
        const opportunity = opportunities[opportunityIndex];
        const startup = startups.find(s => s.id === opportunity.startupId);
        if (!startup) {
            return res.status(404).send({ msg: 'Startup not found' });
        }
        if (startup.ownerId !== userId) {
            // Check if the user is a manager or admin of the startup
            const userRole = userRoles.find(ur => ur.userId === userId &&
                roles.some(r => r.id === ur.roleId && r.startupId === opportunity.startupId &&
                    (r.title.toLowerCase().includes('manager') || r.title.toLowerCase().includes('admin'))));
            if (!userRole) {
                return res.status(403).send({ msg: 'You do not have permission to delete this opportunity' });
            }
        }
        // Delete the opportunity
        opportunities.splice(opportunityIndex, 1);
        saveData();
        res.sendStatus(204);
    }
    catch (error) {
        res.status(500).send({ msg: 'Error deleting opportunity' });
    }
});
// Leads Routes
// @ts-ignore
app.get('/api/leads/startup/:startupId', authMiddleware, (req, res) => {
    try {
        const { startupId } = req.params;
        const startupLeads = leads.filter(lead => lead.startupId === startupId).map(lead => {
            // Populate the assignedTo property with user data if assignedToId exists
            if (lead.assignedToId) {
                const assignedUser = users.find(user => user.id === lead.assignedToId);
                if (assignedUser) {
                    return Object.assign(Object.assign({}, lead), { assignedTo: {
                            id: assignedUser.id,
                            name: assignedUser.name,
                            email: assignedUser.email
                        } });
                }
            }
            return lead;
        });
        res.json(startupLeads);
    }
    catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});
// @ts-ignore
app.post('/api/leads', authMiddleware, (req, res) => {
    try {
        const { name, email, phone, status, source, notes, assignedToId, startupId, nextActionDate, salesAmount } = req.body;
        const newLead = {
            id: (0, uuid_1.v4)(),
            name,
            email,
            phone,
            status,
            source,
            notes,
            salesAmount: salesAmount || 0,
            startupId,
            assignedTo: assignedToId ? users.find(user => user.id === assignedToId) : undefined,
            assignedToId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nextActionDate
        };
        leads.push(newLead);
        saveData();
        res.status(201).json(newLead);
    }
    catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});
// @ts-ignore
app.put('/api/leads/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, status, source, notes, assignedToId, nextActionDate, salesAmount } = req.body;
        const leadIndex = leads.findIndex(lead => lead.id === id);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        const updatedLead = Object.assign(Object.assign({}, leads[leadIndex]), { name,
            email,
            phone,
            status,
            source,
            notes, salesAmount: salesAmount || leads[leadIndex].salesAmount || 0, assignedTo: assignedToId ? users.find(user => user.id === assignedToId) : undefined, assignedToId, updatedAt: new Date().toISOString(), nextActionDate });
        leads[leadIndex] = updatedLead;
        saveData();
        res.json(updatedLead);
    }
    catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});
// @ts-ignore
app.delete('/api/leads/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const leadIndex = leads.findIndex(lead => lead.id === id);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        leads.splice(leadIndex, 1);
        saveData();
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});
// Add PATCH endpoint for leads to handle partial updates
// @ts-ignore
app.patch('/api/leads/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const leadIndex = leads.findIndex(lead => lead.id === id);
        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        // Create updated lead with only the fields that were provided
        const updatedLead = Object.assign(Object.assign(Object.assign({}, leads[leadIndex]), updates), { updatedAt: new Date().toISOString() });
        // If assignedToId was provided, also update the assignedTo object
        if (updates.assignedToId !== undefined) {
            updatedLead.assignedTo = updates.assignedToId ? users.find(user => user.id === updates.assignedToId) : undefined;
        }
        leads[leadIndex] = updatedLead;
        saveData();
        res.json(updatedLead);
    }
    catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});
// API endpoint to add comments to leads
// @ts-ignore
app.post('/api/leads/:id/comments', authMiddleware, (req, res) => {
    var _a, _b;
    try {
        console.log('Comment request received:', {
            leadId: req.params.id,
            body: req.body,
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
        });
        const { id } = req.params;
        const { content } = req.body;
        const authenticatedUserId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!content) {
            console.error('Comment content is missing');
            return res.status(400).json({ error: 'Comment content is required' });
        }
        if (!authenticatedUserId) {
            console.error('No authenticated user ID available');
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Find the lead
        const lead = leads.find(l => l.id === id);
        if (!lead) {
            console.error(`Lead not found: ${id}`);
            return res.status(404).json({ error: 'Lead not found' });
        }
        // Find the authenticated user
        const user = users.find(u => u.id === authenticatedUserId);
        if (!user) {
            // Create a new user entry if this is a test environment
            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
                console.log('Creating temporary user for test environment');
                const newUser = {
                    id: authenticatedUserId,
                    name: "Test User",
                    email: "test@example.com",
                    password: "$2a$10$some-hashed-password",
                    points: 0,
                    level: 'BEGINNER',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                users.push(newUser);
                saveData();
            }
            else {
                return res.status(500).json({ error: 'User authentication error' });
            }
        }
        // Create the comment
        const newComment = {
            id: (0, uuid_1.v4)(),
            content,
            leadId: id,
            userId: authenticatedUserId,
            createdAt: new Date().toISOString()
        };
        // Add to the comments array
        leadComments.push(newComment);
        // Update the lead's updatedAt timestamp
        const leadIndex = leads.findIndex(l => l.id === id);
        if (leadIndex !== -1) {
            leads[leadIndex].updatedAt = new Date().toISOString();
        }
        // Find the user again (might be newly created in test environment)
        const commentUser = users.find(u => u.id === authenticatedUserId);
        // Return comment with user data for display
        const commentWithUser = Object.assign(Object.assign({}, newComment), { user: commentUser ? {
                id: commentUser.id,
                name: commentUser.name,
                email: commentUser.email
            } : {
                id: authenticatedUserId,
                name: "Unknown User",
                email: ""
            } });
        // Save data to disk
        saveData();
        console.log('Comment added successfully:', commentWithUser);
        res.status(201).json(commentWithUser);
    }
    catch (error) {
        console.error('Error adding lead comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});
// Add the password change endpoint
app.put('/api/auth/change-password', (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, 'your-secret-key');
        const userId = decoded.userId;
        // Find user
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[userIndex];
        // In a real app, we'd use bcrypt
        // For this demo, we assume passwords are stored directly
        if (!user.password || user.password !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Update password
        users[userIndex] = Object.assign(Object.assign({}, user), { password: newPassword });
        // Save updated users
        saveData();
        return res.status(200).json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ error: 'Failed to change password' });
    }
});
// API route to get all leads for a user
app.get('/api/leads', authMiddleware, (req, res) => {
    try {
        const userId = req.user.id;
        // Filter leads where user is the owner or assignee
        const userLeads = leads.filter((lead) => {
            var _a;
            return lead.assignedToId === userId ||
                ((_a = startups.find((s) => s.id === lead.startupId)) === null || _a === void 0 ? void 0 : _a.ownerId) === userId;
        });
        // Add related data
        const leadsWithDetails = userLeads.map((lead) => {
            return Object.assign(Object.assign({}, lead), { assignedTo: lead.assignedToId ? users.find((u) => u.id === lead.assignedToId) : null, startup: startups.find((s) => s.id === lead.startupId), comments: leadComments.filter((c) => c.leadId === lead.id).map((comment) => (Object.assign(Object.assign({}, comment), { user: users.find((u) => u.id === comment.userId) }))) });
        });
        res.json(leadsWithDetails);
    }
    catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});
// API route to get leads for a specific startup
app.get('/api/startups/:startupId/leads', authMiddleware, (req, res) => {
    try {
        const { startupId } = req.params;
        const userId = req.user.id;
        // Check if user has access to this startup
        const startup = startups.find(s => s.id === startupId);
        if (!startup) {
            res.status(404).json({ error: 'Startup not found' });
            return;
        }
        const isOwner = startup.ownerId === userId;
        const isMember = userRoles.some((ur) => ur.userId === userId && ur.startupId === startupId);
        if (!isOwner && !isMember) {
            res.status(403).json({ error: 'You do not have access to this startup' });
            return;
        }
        // Get leads for the startup
        const startupLeads = leads.filter(lead => lead.startupId === startupId);
        // Add related data
        const leadsWithDetails = startupLeads.map(lead => {
            return Object.assign(Object.assign({}, lead), { assignedTo: lead.assignedToId ? users.find(u => u.id === lead.assignedToId) : null, comments: leadComments.filter(c => c.leadId === lead.id).map(comment => (Object.assign(Object.assign({}, comment), { user: users.find(u => u.id === comment.userId) }))) });
        });
        res.json(leadsWithDetails);
    }
    catch (error) {
        console.error('Error fetching startup leads:', error);
        res.status(500).json({ error: 'Failed to fetch startup leads' });
    }
});
// API route to create a new lead
app.post('/api/leads', authMiddleware, (req, res) => {
    try {
        const { name, email, phone, status, source, notes, salesAmount, nextActionDate, assignedToId, startupId } = req.body;
        const userId = req.user.id;
        // Check if user has access to this startup
        const startup = startups.find(s => s.id === startupId);
        if (!startup) {
            res.status(404).json({ error: 'Startup not found' });
            return;
        }
        const isOwner = startup.ownerId === userId;
        const isMember = userRoles.some((ur) => ur.userId === userId && ur.startupId === startupId);
        if (!isOwner && !isMember) {
            res.status(403).json({ error: 'You do not have access to this startup' });
            return;
        }
        // Create new lead with proper typing
        const newLead = {
            id: (0, uuid_1.v4)(),
            name,
            email,
            phone,
            status,
            source,
            notes,
            salesAmount: parseFloat(salesAmount) || 0,
            startupId,
            assignedTo: assignedToId ? users.find(user => user.id === assignedToId) : undefined,
            assignedToId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nextActionDate: nextActionDate || null,
            comments: []
        };
        leads.push(newLead);
        saveData();
        res.status(201).json(newLead);
    }
    catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});
// API route to fetch members for a startup (for lead assignment)
app.get('/api/startups/:startupId/members', authMiddleware, (req, res) => {
    try {
        const { startupId } = req.params;
        // Get all users who are members of the startup
        const members = userRoles
            .filter((ur) => ur.startupId === startupId)
            .map(ur => {
            const user = users.find(u => u.id === ur.userId);
            return user ? {
                id: user.id,
                name: user.name,
                email: user.email
            } : null;
        })
            .filter(Boolean);
        // Add the owner
        const startup = startups.find(s => s.id === startupId);
        if (startup) {
            const owner = users.find(u => u.id === startup.ownerId);
            if (owner && !members.some(m => m && m.id === owner.id)) {
                members.push({
                    id: owner.id,
                    name: owner.name,
                    email: owner.email
                });
            }
        }
        res.json(members);
    }
    catch (error) {
        console.error('Error fetching startup members:', error);
        res.status(500).json({ error: 'Failed to fetch startup members' });
    }
});
// API route to fetch members for a startup with their roles
app.get('/api/startups/:startupId/members-with-roles', authMiddleware, (req, res) => {
    try {
        const { startupId } = req.params;
        const userId = req.user.id;
        // Check if startup exists
        const startup = startups.find(s => s.id === startupId);
        if (!startup) {
            return res.status(404).json({ msg: 'Startup not found' });
        }
        // Check if user is owner or admin
        const isOwner = startup.ownerId === userId;
        let isAdmin = false;
        if (!isOwner) {
            // Check if user has admin role
            const userRole = userRoles.find(ur => ur.userId === userId &&
                ur.startupId === startupId);
            if (userRole) {
                const role = roles.find(r => r.id === userRole.roleId);
                isAdmin = role ? role.roleType.toLowerCase().includes('admin') : false;
            }
            if (!isAdmin) {
                return res.status(403).json({ msg: 'Not authorized to view roles for this startup' });
            }
        }
        // Get all members with their roles
        const members = users
            .filter(user => {
            // Include owner
            if (user.id === startup.ownerId)
                return true;
            // Include users with roles in this startup
            const hasRole = userRoles.some(ur => ur.userId === user.id &&
                ur.startupId === startupId);
            return hasRole;
        })
            .map(user => {
            const userRole = userRoles.find(ur => ur.userId === user.id &&
                ur.startupId === startupId);
            let role;
            if (userRole) {
                const roleData = roles.find(r => r.id === userRole.roleId);
                if (roleData) {
                    role = {
                        id: roleData.id,
                        title: roleData.title,
                        roleType: roleData.roleType
                    };
                }
            }
            // If user is the owner but doesn't have a role, add a special role
            if (user.id === startup.ownerId && !role) {
                role = {
                    id: 'owner',
                    title: 'Founder',
                    roleType: 'Admin'
                };
            }
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role
            };
        });
        res.json(members);
    }
    catch (error) {
        console.error('Error fetching startup members with roles:', error);
        res.status(500).json({ error: 'Failed to fetch startup members with roles' });
    }
});
// API route to get all roles for a startup
app.get('/api/startups/:startupId/roles', authMiddleware, (req, res) => {
    try {
        const { startupId } = req.params;
        const userId = req.user.id;
        // Check if startup exists
        const startup = startups.find(s => s.id === startupId);
        if (!startup) {
            return res.status(404).json({ msg: 'Startup not found' });
        }
        // Check if user is owner or admin
        const isOwner = startup.ownerId === userId;
        let isAdmin = false;
        if (!isOwner) {
            // Check if user has admin role
            const userRole = userRoles.find(ur => ur.userId === userId &&
                ur.startupId === startupId);
            if (userRole) {
                const role = roles.find(r => r.id === userRole.roleId);
                isAdmin = role ? role.roleType.toLowerCase().includes('admin') : false;
            }
            if (!isAdmin) {
                return res.status(403).json({ msg: 'Not authorized to view roles for this startup' });
            }
        }
        // Get all roles for this startup
        const startupRoles = roles.filter(role => role.startupId === startupId);
        res.json(startupRoles);
    }
    catch (error) {
        console.error('Error fetching startup roles:', error);
        res.status(500).json({ error: 'Failed to fetch startup roles' });
    }
});
// API route to update a user's role in a startup
app.put('/api/startups/:startupId/users/:userId/role', authMiddleware, (req, res) => {
    try {
        const { startupId, userId } = req.params;
        const { roleId } = req.body;
        const requestingUserId = req.user.id;
        if (!roleId) {
            return res.status(400).json({ msg: 'Role ID is required' });
        }
        // Check if startup exists
        const startup = startups.find(s => s.id === startupId);
        if (!startup) {
            return res.status(404).json({ msg: 'Startup not found' });
        }
        // Check if user is owner or admin
        const isOwner = startup.ownerId === requestingUserId;
        let isAdmin = false;
        if (!isOwner) {
            // Check if user has admin role
            const userRole = userRoles.find(ur => ur.userId === requestingUserId &&
                ur.startupId === startupId);
            if (userRole) {
                const role = roles.find(r => r.id === userRole.roleId);
                isAdmin = role ? role.roleType.toLowerCase().includes('admin') : false;
            }
            if (!isAdmin) {
                return res.status(403).json({ msg: 'Not authorized to update roles for this startup' });
            }
        }
        // Check if the role exists and belongs to this startup
        const role = roles.find(r => r.id === roleId && r.startupId === startupId);
        if (!role) {
            return res.status(404).json({ msg: 'Role not found in this startup' });
        }
        // Check if the target user exists
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        // Special check - don't allow changing the role of the owner
        if (userId === startup.ownerId) {
            return res.status(403).json({ msg: 'Cannot change the role of the startup owner' });
        }
        // Check if the user already has a role in this startup
        const existingUserRole = userRoles.find(ur => ur.userId === userId &&
            ur.startupId === startupId);
        if (existingUserRole) {
            // Update the existing user role
            existingUserRole.roleId = roleId;
        }
        else {
            // Create a new user role
            userRoles.push({
                id: `ur-${Date.now()}`,
                userId,
                roleId,
                startupId,
                joinedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        res.json({ msg: 'User role updated successfully' });
    }
    catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(__dirname, production_1.default.frontend.buildPath)));
    // Handle client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, production_1.default.frontend.buildPath, 'index.html'));
    });
}
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Please close any other instances of the server or use a different port.`);
        process.exit(1); // Exit with error code
    }
    else {
        console.error('Server error:', err);
    }
});
// Handle shutdown gracefully
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
    process.exit(0);
}));
