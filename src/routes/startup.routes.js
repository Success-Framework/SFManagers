const express = require('express');
// const prisma = require('../prisma').default; // Remove or comment out
const { db } = require('../database'); // Add this line to import the MySQL db adapter
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Create a new startup (authenticated)
router.post('/', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, location, industry, mission, vision } = req.body;
    let roles = [];
    
    // Parse roles from string (FormData converts arrays to strings)
    if (req.body.roles) {
      try {
        roles = JSON.parse(req.body.roles);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid roles format' });
      }
    }
    
    const userId = req.user.id;
    
    // Validate input
    if (!name || !description || !roles || !Array.isArray(roles) || roles.length === 0 || roles.length > 5) {
      return res.status(400).json({ 
        error: 'Invalid input. Please provide name, description, and between 1-5 roles.' 
      });
    }
    
    // Check if each role has title and roleType
    for (const role of roles) {
      if (!role.title || !role.roleType) {
        return res.status(400).json({
          error: 'Each role must have a title and role type.'
        });
      }
    }
    
    // Get file paths if uploaded
    let logoPath = null;
    let bannerPath = null;
    
    if (req.files) {
      if (req.files.logo && req.files.logo.length > 0) {
        logoPath = `/uploads/${req.files.logo[0].filename}`;
      }
      
      if (req.files.banner && req.files.banner.length > 0) {
        bannerPath = `/uploads/${req.files.banner[0].filename}`;
      }
    }
    
    // Create startup in database
    const startupData = {
      id: uuidv4(), // Generate UUID
      name,
      details: description,
      stage: 'Idea', // Default stage
      logo: logoPath,
      banner: bannerPath,
      location: location || null,
      industry: industry || null,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Use transaction to ensure atomicity
    const result = await db.transaction(async (dbTx) => {
      // Create startup
      const startup = await dbTx.create('startups', startupData);
      
      // Create roles
      for (const role of roles) {
        await dbTx.create('roles', {
          id: uuidv4(), // Generate UUID
          title: role.title,
          roleType: role.roleType,
          isPaid: role.isPaid || false,
          isOpen: true,
          startupId: startup.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return startup;
    });
    
    // Get the complete startup with its roles
    const createdStartup = await db.findOne('startups', { id: result.id });
    const createdRoles = await db.findMany('roles', { startupId: result.id });
    const owner = await db.findOne('users', { id: userId });
    
    const completeStartup = {
      ...createdStartup,
      roles: createdRoles,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email
      }
    };
    
    return res.status(201).json(completeStartup);
  } catch (error) {
    console.error('Error creating startup:', error);
    return res.status(500).json({ error: 'Failed to create startup' });
  }
});

// Get all startups (public)
router.get('/', async (_req, res) => {
  try {
    console.log('Attempting to fetch all startups...');
    
    // Fetch all startups using db adapter
    const startups = await db.findMany('startups');
    console.log(`Successfully fetched ${startups.length} startups`);
    
    // For each startup, get its roles, users and owner
    const transformedStartups = [];
    
    for (const startup of startups) {
      // Get the owner of this startup
      const owner = await db.findOne('users', { id: startup.ownerId });
      
      // Get roles for this startup
      const roles = await db.findMany('roles', { startupId: startup.id });
      
      // Get users for each role
      const rolesWithUsers = [];
      for (const role of roles) {
        // Find user_roles entries for this role
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM user_roles ur
          JOIN users u ON ur.userId = u.id
          WHERE ur.roleId = ?
        `;
        const userRoles = await db.raw(userRolesQuery, [role.id]);
        
        // Format role with users
        rolesWithUsers.push({
          ...role,
          users: userRoles.map(ur => ({
            id: ur.userId,
            name: ur.name,
            email: ur.email
          }))
        });
      }
      
      // Add roles and owner to startup
      transformedStartups.push({
        ...startup,
        roles: rolesWithUsers,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email
        } : null
      });
    }
    
    console.log('Successfully transformed startup data');
    return res.json(transformedStartups);
  } catch (error) {
    console.error('Detailed error fetching startups:');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch startups',
      details: error?.message,
      code: error?.code
    });
  }
});

// Get startups owned by a specific user
router.get('/owned/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching owned startups for user:', userId);
    
    // Fetch owned startups using db adapter
    const startups = await db.findMany('startups', { ownerId: userId });
    console.log(`Found ${startups.length} owned startups for user ${userId}`);

    // For each startup, get its roles and members
    const transformedStartups = [];
    
    for (const startup of startups) {
      // Get roles for this startup
      const roles = await db.findMany('roles', { startupId: startup.id });
      
      // Get users for each role
      const rolesWithUsers = [];
      for (const role of roles) {
        // Find user_roles entries for this role
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM user_roles ur
          JOIN users u ON ur.userId = u.id
          WHERE ur.roleId = ?
        `;
        const userRoles = await db.raw(userRolesQuery, [role.id]);
        
        // Format role with users
        rolesWithUsers.push({
          ...role,
          users: userRoles.map(ur => ({
            id: ur.userId,
            name: ur.name,
            email: ur.email
          }))
        });
      }
      
      // Add roles to startup
      transformedStartups.push({
        ...startup,
        roles: rolesWithUsers
      });
    }
    
    return res.json(transformedStartups);
  } catch (error) {
    console.error('Error fetching owned startups:', error);
    return res.status(500).json({ error: 'Failed to fetch owned startups' });
  }
});

// Get startups owned by the authenticated user
router.get('/my-startups', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching owned startups for authenticated user:', userId);
    
    // Fetch owned startups using db adapter
    const startups = await db.findMany('startups', { ownerId: userId });
    console.log(`Found ${startups.length} owned startups`);

    // For each startup, get its roles and members
    const transformedStartups = [];
    
    for (const startup of startups) {
      // Get roles for this startup
      const roles = await db.findMany('roles', { startupId: startup.id });
      
      // Get users for each role
      const rolesWithUsers = [];
      for (const role of roles) {
        // Find user_roles entries for this role
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM user_roles ur
          JOIN users u ON ur.userId = u.id
          WHERE ur.roleId = ?
        `;
        const userRoles = await db.raw(userRolesQuery, [role.id]);
        
        // Format role with users
        rolesWithUsers.push({
          ...role,
          users: userRoles.map(ur => ({
            id: ur.userId,
            name: ur.name,
            email: ur.email
          }))
        });
      }
      
      // Add roles to startup
      transformedStartups.push({
        ...startup,
        roles: rolesWithUsers
      });
    }
    
    return res.json(transformedStartups);
  } catch (error) {
    console.error('Error fetching owned startups:', error);
    return res.status(500).json({ error: 'Failed to fetch owned startups' });
  }
});

// Get a specific startup by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find startup by ID
    const startup = await db.findOne('startups', { id });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    // Get the owner of this startup
    const owner = await db.findOne('users', { id: startup.ownerId });
    
    // Get roles for this startup
    const roles = await db.findMany('roles', { startupId: startup.id });
    
    // Get users for each role
    const rolesWithUsers = [];
    for (const role of roles) {
      // Find user_roles entries for this role
      const userRolesQuery = `
        SELECT ur.*, u.id as userId, u.name, u.email
        FROM user_roles ur
        JOIN users u ON ur.userId = u.id
        WHERE ur.roleId = ?
      `;
      const userRoles = await db.raw(userRolesQuery, [role.id]);
      
      // Format role with users
      rolesWithUsers.push({
        ...role,
        assignedUser: userRoles.length > 0 ? {
          id: userRoles[0].userId,
          name: userRoles[0].name,
          email: userRoles[0].email
        } : undefined
      });
    }
    
    // Add roles and owner to startup
    const transformedStartup = {
      ...startup,
      roles: rolesWithUsers,
      owner: owner ? {
        id: owner.id,
        name: owner.name,
        email: owner.email
      } : null
    };
    
    return res.json(transformedStartup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    return res.status(500).json({ error: 'Failed to fetch startup' });
  }
});

// Update a startup (authenticated, owner only)
router.put('/:id', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, details, stage, website, location, industry, logoUrl, bannerUrl } = req.body;
    const userId = req.user.id;
    
    // Check if startup exists and user is the owner
    const startup = await db.findOne('startups', { id });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this startup' });
    }
    
    // Prepare update data
    const updateData = {
      name: name || undefined,
      details: details || undefined,
      stage: stage || undefined,
      website: website || undefined,
      location: location || undefined,
      industry: industry || undefined
    };
    
    // Handle logo file upload
    if (req.files && req.files.logo && req.files.logo.length > 0) {
      updateData.logo = `/uploads/${req.files.logo[0].filename}`;
      
      // Delete old logo file if exists and is not a URL
      if (startup.logo && startup.logo.startsWith('/uploads/')) {
        const oldLogoPath = path.join(__dirname, '..', startup.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
    } else if (logoUrl) {
      // If no new file but URL provided, use URL
      updateData.logo = logoUrl;
    }
    
    // Handle banner file upload
    if (req.files && req.files.banner && req.files.banner.length > 0) {
      updateData.banner = `/uploads/${req.files.banner[0].filename}`;
      
      // Delete old banner file if exists and is not a URL
      if (startup.banner && startup.banner.startsWith('/uploads/')) {
        const oldBannerPath = path.join(__dirname, '..', startup.banner);
        if (fs.existsSync(oldBannerPath)) {
          fs.unlinkSync(oldBannerPath);
        }
      }
    } else if (bannerUrl) {
      // If no new file but URL provided, use URL
      updateData.banner = bannerUrl;
    }
    
    // Update startup
    const updatedStartup = await db.update('startups', id, updateData);
    
    return res.json(updatedStartup);
  } catch (error) {
    console.error('Error updating startup:', error);
    return res.status(500).json({ error: 'Failed to update startup' });
  }
});

// Get all members of a startup
router.get('/:startupId/members', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await db.findOne('startups', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Get all members (owner + people with accepted roles)
    const owner = await db.findOne('users', { id: startup.ownerId });
    
    // Get all roles for this startup
    const roles = await db.findMany('roles', { startupId });
    const roleIds = roles.map(role => role.id);
    
    // Now get all user roles for these role IDs
    let roleMembers = [];
    if (roleIds.length > 0) {
      // MySQL doesn't handle array parameters correctly with IN clause
      // We need to construct the query differently
      const placeholders = roleIds.map(() => '?').join(',');
      const query = `
        SELECT ur.userId, u.name, u.email
        FROM user_roles ur
        JOIN users u ON ur.userId = u.id
        WHERE ur.roleId IN (${placeholders})
      `;
      roleMembers = await db.raw(query, roleIds);
    }
    
    // Combine owner and members, removing duplicates
    const members = [
      {
        id: owner.id,
        name: owner.name,
        email: owner.email
      },
      ...roleMembers.map(member => ({
        id: member.userId,
        name: member.name,
        email: member.email
      }))
    ].filter((member, index, self) => 
      index === self.findIndex(m => m.id === member.id)
    );
    
    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Get members of a startup WITH their roles
router.get('/:startupId/members-with-roles', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await db.findOne('startups', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // First get all roles for this startup
    const roles = await db.findMany('roles', { startupId });
    const roleIds = roles.map(role => role.id);
    
    // Now fetch members with roles using a single query
    let members = [];
    if (roleIds.length > 0) {
      // MySQL doesn't handle array parameters correctly with IN clause
      // We need to construct the query differently
      const placeholders = roleIds.map(() => '?').join(',');
      const query = `
        SELECT ur.userId, ur.roleId, u.name, u.email, r.title, r.roleType
        FROM user_roles ur
        JOIN users u ON ur.userId = u.id
        JOIN roles r ON ur.roleId = r.id
        WHERE ur.roleId IN (${placeholders})
      `;
      
      const userRoles = await db.raw(query, roleIds);
      
      // Transform the data into the expected format
      members = userRoles.map(ur => ({
        userId: ur.userId,
        role: {
          id: ur.roleId,
          title: ur.title,
          roleType: ur.roleType
        },
        user: {
          id: ur.userId,
          name: ur.name,
          email: ur.email
        }
      }));
    }
    
    res.json(members);
  } catch (err) {
    console.error('Error fetching members with roles:', err);
    res.status(500).json({ error: 'Failed to fetch members with roles' });
  }
});

// Update a user's role in a startup
router.put('/:startupId/users/:userId/role', authMiddleware, async (req, res) => {
  try {
    const { startupId, userId } = req.params;
    const { roleId } = req.body;
    const requestingUserId = req.user.id;
    
    if (!roleId) {
      return res.status(400).json({ msg: 'Role ID is required' });
    }
    
    // Check if startup exists
    const startup = await db.findOne('startups', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Check if user is the owner or an admin
    const isOwner = startup.ownerId === requestingUserId;
    
    if (!isOwner) {
      // Get all roles for this startup
      const roles = await db.findMany('roles', { startupId });
      const roleIds = roles.map(role => role.id);
      
      // Check if the requesting user has an admin role
      let isAdmin = false;
      if (roleIds.length > 0) {
        // MySQL doesn't handle array parameters correctly with IN clause
        // We need to construct the query differently
        const placeholders = roleIds.map(() => '?').join(',');
        const query = `
          SELECT ur.id, r.roleType
          FROM user_roles ur
          JOIN roles r ON ur.roleId = r.id
          WHERE ur.userId = ? AND ur.roleId IN (${placeholders})
        `;
        
        const params = [requestingUserId, ...roleIds];
        const userRoles = await db.raw(query, params);
        isAdmin = userRoles.some(role => role.roleType.toLowerCase().includes('admin'));
      }
      
      if (!isAdmin) {
        return res.status(403).json({ msg: 'Not authorized to update roles for this startup' });
      }
    }
    
    // Check if the role exists and belongs to this startup
    const role = await db.findOne('roles', { id: roleId, startupId });
    
    if (!role) {
      return res.status(404).json({ msg: 'Role not found in this startup' });
    }
    
    // Check if the target user exists
    const targetUser = await db.findOne('users', { id: userId });
    
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Special check - don't allow changing the role of the owner
    if (userId === startup.ownerId) {
      return res.status(403).json({ msg: 'Cannot change the role of the startup owner' });
    }
    
    // Check if the user already has a role in this startup
    const existingUserRole = await db.findOne('user_roles', { userId, roleId });
    
    if (existingUserRole) {
      // Update the existing user role
      await db.update('user_roles', existingUserRole.id, { roleId });
    } else {
      // Create a new user role
      await db.create('user_roles', { userId, roleId, startupId });
    }
    
    res.json({ msg: 'User role updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add new roles to a startup (authenticated, owner only)
router.post('/:id/roles', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input. Please provide at least one role.' 
      });
    }
    
    // Check if each role has title and roleType
    for (const role of roles) {
      if (!role.title || !role.roleType) {
        return res.status(400).json({
          error: 'Each role must have a title and role type.'
        });
      }
    }
    
    // Check if startup exists and user is the owner
    const startup = await db.findOne('startups', { id });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to add roles to this startup' });
    }
    
    // Create the new roles
    const createdRoles = await Promise.all(
      roles.map(role => 
        db.create('roles', {
          id: uuidv4(), // Generate UUID
          title: role.title,
          roleType: role.roleType,
          isOpen: role.isOpen !== undefined ? role.isOpen : true,
          startupId: id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      )
    );
    
    // Get the updated startup with all roles
    const updatedStartup = await db.findOne('startups', { id });
    
    // Transform the data to include assignedUser directly on roles
    const transformedStartup = {
      ...updatedStartup,
      roles: createdRoles.map(role => ({
        ...role,
        assignedUser: null
      }))
    };
    
    return res.status(201).json({
      message: 'Roles added successfully',
      startup: transformedStartup,
      addedRoles: createdRoles
    });
  } catch (error) {
    console.error('Error adding roles to startup:', error);
    return res.status(500).json({ error: 'Failed to add roles to startup' });
  }
});

// Edit a role (authenticated, owner only)
router.put('/roles/:roleId', authMiddleware, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { title, roleType, isOpen } = req.body;
    const userId = req.user.id;
    
    // Find the role and check if it exists
    const role = await db.findOne('roles', { id: roleId });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if the user is the startup owner
    const startup = await db.findOne('startups', { id: role.startupId });
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this role' });
    }
    
    // Update the role
    const updatedRole = await db.update('roles', roleId, {
      title: title || undefined,
      roleType: roleType || undefined,
      isOpen: isOpen !== undefined ? isOpen : undefined
    });
    
    // Get users assigned to this role
    const userRolesQuery = `
      SELECT u.id, u.name, u.email
      FROM user_roles ur
      JOIN users u ON ur.userId = u.id
      WHERE ur.roleId = ?
      LIMIT 1
    `;
    const userRoles = await db.raw(userRolesQuery, [roleId]);
    
    // Transform the response to include assigned user
    const assignedUser = userRoles.length > 0
      ? {
          id: userRoles[0].id,
          name: userRoles[0].name,
          email: userRoles[0].email
        }
      : undefined;
      
    const transformedRole = {
      ...updatedRole,
      assignedUser
    };
    
    return res.json({
      message: 'Role updated successfully',
      role: transformedRole
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete a role (authenticated, owner only)
router.delete('/roles/:roleId', authMiddleware, async (req, res) => {
  try {
    const { roleId } = req.params;
    const userId = req.user.id;
    
    // Find the role and check if it exists
    const role = await db.findOne('roles', { id: roleId });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if the user is the startup owner
    const startup = await db.findOne('startups', { id: role.startupId });
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this role' });
    }
    
    // Check if the role has assigned users
    const userRolesQuery = `
      SELECT COUNT(*) as count
      FROM user_roles
      WHERE roleId = ?
    `;
    const userRolesCount = await db.raw(userRolesQuery, [roleId]);
    
    if (userRolesCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete a role with assigned users. Please remove the users first.' 
      });
    }
    
    // Delete any pending join requests for this role
    await db.deleteMany('join_requests', { roleId });
    
    // Delete the role
    await db.delete('roles', { id: roleId });
    
    return res.json({
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
});

// Get all roles for a startup
router.get('/:startupId/roles', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await db.findOne('startups', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Get all roles for this startup
    const rolesQuery = 'SELECT id, title, roleType, isOpen, isPaid FROM roles WHERE startupId = ?';
    const roles = await db.raw(rolesQuery, [startupId]);
    
    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get user roles for a specific startup
router.get('/:startupId/user-roles', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;
    
    // Check if startup exists
    const startup = await db.findOne('startups', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Check if user is the owner
    const isOwner = startup.ownerId === userId;
    
    // If user is owner, return admin role
    if (isOwner) {
      return res.json([{
        role: {
          id: 'owner',
          title: 'Founder',
          roleType: 'Admin'
        }
      }]);
    }
    
    // Get user's roles for this startup using SQL
    const userRolesQuery = `
      SELECT r.id, r.title, r.roleType 
      FROM user_roles ur
      JOIN roles r ON ur.roleId = r.id
      WHERE ur.userId = ? AND r.startupId = ?
    `;
    const userRoles = await db.raw(userRolesQuery, [userId, startupId]);
    
    // Transform to match expected format
    const formattedRoles = userRoles.map(role => ({
      role: {
        id: role.id,
        title: role.title,
        roleType: role.roleType
      }
    }));
    
    res.json(formattedRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

// Get startups where the user has joined roles
router.get('/joined-startups', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching joined startups for user:', userId);
    
    // Get all startups where the user has roles using SQL query
    const joinedStartupsQuery = `
      SELECT DISTINCT s.*, r.id as roleId, r.title as roleTitle, r.roleType, r.isPaid,
             r.description as roleDescription, r.isOpen, r.createdAt as roleCreatedAt,
             r.updatedAt as roleUpdatedAt
      FROM user_roles ur
      JOIN roles r ON ur.roleId = r.id
      JOIN startups s ON r.startupId = s.id
      WHERE ur.userId = ?
    `;
    
    const startupRows = await db.raw(joinedStartupsQuery, [userId]);
    
    if (!startupRows || !startupRows.length) {
      console.log('No joined startups found for user:', userId);
      return res.json([]);
    }
    
    console.log(`Found ${startupRows.length} joined startups`);
    
    // Group roles by startup to structure data correctly
    const startupMap = new Map();
    
    startupRows.forEach(row => {
      const startupId = row.id;
      
      if (!startupMap.has(startupId)) {
        startupMap.set(startupId, {
          id: startupId,
          name: row.name,
          details: row.details,
          stage: row.stage,
          logo: row.logo,
          banner: row.banner,
          location: row.location,
          industry: row.industry,
          ownerId: row.ownerId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          roles: []
        });
      }
      
      // Add this role to the startup
      const startup = startupMap.get(startupId);
      startup.roles.push({
        id: row.roleId,
        title: row.roleTitle,
        roleType: row.roleType,
        isPaid: row.isPaid === 1, // Convert from integer to boolean
        description: row.roleDescription,
        isOpen: row.isOpen === 1, // Convert from integer to boolean
        createdAt: row.roleCreatedAt,
        updatedAt: row.roleUpdatedAt,
        users: [{ id: userId }] // Include the current user as assigned to this role
      });
    });
    
    // Convert the Map values to an array
    const joinedStartups = Array.from(startupMap.values());
    
    return res.json(joinedStartups);
  } catch (error) {
    console.error('Error fetching joined startups:', error);
    return res.status(500).json({ error: 'Failed to fetch joined startups' });
  }
});

module.exports = router; 