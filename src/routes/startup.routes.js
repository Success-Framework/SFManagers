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
    // Use a single upload directory in the root of the project
    const uploadDir = path.join(__dirname, '../../uploads');
    
    try {
      if (!fs.existsSync(uploadDir)) {
        console.log(`Creating uploads directory at: ${uploadDir}`);
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      console.log(`Using uploads directory: ${uploadDir}`);
      cb(null, uploadDir);
    } catch (err) {
      console.error(`Failed to create or access uploads directory:`, err);
      cb(new Error('Could not access uploads directory'), null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, filename);
    
    // Log the filename for debugging
    console.log(`Generated filename: ${filename}`);
  }
});

// Create upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Helper function to get complete startup data with owner and roles
const getCompleteStartupData = async (startupId) => {
  const startup = await db.findOne('Startup', { id: startupId });
  if (!startup) return null;
  
  const roles = await db.findMany('Role', { startupId });
  const owner = await db.findOne('User', { id: startup.ownerId });
  
  return {
    ...startup,
    roles,
    owner: owner ? {
      id: owner.id,
      name: owner.name,
      email: owner.email
    } : null
  };
};

// Create a new startup (authenticated)
router.post('/', authMiddleware, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received startup creation request');
    const { name, description, location, industry } = req.body;
    let roles = [];
    
    // Parse roles from string (FormData converts arrays to strings)
    if (req.body.roles) {
      try {
        roles = JSON.parse(req.body.roles);
        console.log(`Parsed ${roles.length} roles from request`);
      } catch (error) {
        console.error('Failed to parse roles:', error);
        return res.status(400).json({ error: 'Invalid roles format' });
      }
    }
    
    const userId = req.user.id;
    console.log(`Processing startup creation for user: ${userId}`);
    
    // Validate input
    if (!name || !description || !roles || !Array.isArray(roles) || roles.length === 0 || roles.length > 5) {
      console.error('Validation failed:', { name, description, rolesLength: roles?.length });
      return res.status(400).json({ 
        error: 'Invalid input. Please provide name, description, and between 1-5 roles.' 
      });
    }
    
    // Check if each role has title and roleType
    for (const role of roles) {
      if (!role.title || !role.roleType) {
        console.error('Role validation failed:', role);
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
        console.log(`Logo file processed: ${logoPath}`);
      }
      
      if (req.files.banner && req.files.banner.length > 0) {
        bannerPath = `/uploads/${req.files.banner[0].filename}`;
        console.log(`Banner file processed: ${bannerPath}`);
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
    
    console.log('Attempting to create startup with data:', {
      id: startupData.id,
      name: startupData.name,
      details: startupData.details ? startupData.details.substring(0, 20) + '...' : null,
      ownerId: startupData.ownerId
    });
    
    // Check if the Startup table exists and get its columns
    try {
      const checkTableQuery = 'SHOW COLUMNS FROM Startup';
      const columns = await db.query(checkTableQuery);
      console.log('Startup table columns:', columns.map(col => col.Field).join(', '));
    } catch (tableError) {
      console.error('Error checking Startup table structure:', tableError);
      return res.status(500).json({ error: 'Database configuration error' });
    }
    
    let result;
    try {
      // Use transaction to ensure atomicity
      result = await db.transaction(async (dbTx) => {
        console.log('Starting transaction for startup creation');
        
        // Create startup
        const startup = await dbTx.create('Startup', startupData);
        console.log(`Created startup with ID: ${startup.id}`);
        
        // Create roles
        console.log(`Creating ${roles.length} roles for startup ${startup.id}`);
        for (const role of roles) {
          const roleData = {
            id: uuidv4(), // Generate UUID
            title: role.title,
            roleType: role.roleType,
            isPaid: role.isPaid || false,
            isOpen: true,
            startupId: startup.id,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log(`Creating role: ${roleData.title} (${roleData.id})`);
          await dbTx.create('Role', roleData);
        }
        
        // Add owner as a member
        const membershipId = uuidv4();
        console.log(`Adding owner ${userId} as member with ID ${membershipId}`);
        await dbTx.query(
          'INSERT INTO startup_members (id, userId, startupId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [membershipId, userId, startup.id, new Date(), new Date()]
        );
        
        console.log('Transaction completed successfully');
        return startup;
      });
    } catch (transactionError) {
      console.error('Transaction failed during startup creation:', transactionError);
      // Try to provide more specific error messages based on the error
      if (transactionError.code === 'ER_BAD_FIELD_ERROR') {
        return res.status(500).json({ 
          error: 'Database schema mismatch. Please contact support.',
          details: transactionError.message
        });
      } else if (transactionError.code === 'ER_NO_SUCH_TABLE') {
        return res.status(500).json({ 
          error: 'Required database table not found. Please contact support.',
          details: transactionError.message
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to create startup due to database error',
          details: transactionError.message
        });
      }
    }
    
    if (!result || !result.id) {
      console.error('Transaction completed but no startup ID was returned');
      return res.status(500).json({ error: 'Failed to create startup - no ID returned' });
    }
    
    try {
      // Get the complete startup with its roles
      console.log(`Fetching complete startup data for ID: ${result.id}`);
      const createdStartup = await db.findOne('Startup', { id: result.id });
      if (!createdStartup) {
        console.error(`Could not find created startup with ID: ${result.id}`);
        return res.status(500).json({ error: 'Startup was created but could not be retrieved' });
      }
      
      const createdRoles = await db.findMany('Role', { startupId: result.id });
      console.log(`Found ${createdRoles.length} roles for startup ${result.id}`);
      
      const owner = await db.findOne('User', { id: userId });
      if (!owner) {
        console.error(`Could not find owner with ID: ${userId}`);
      }
      
      const completeStartup = {
        ...createdStartup,
        roles: createdRoles,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email
        } : null
      };
      
      console.log('Startup creation completed successfully');
      return res.status(201).json(completeStartup);
    } catch (fetchError) {
      console.error('Error fetching complete startup data:', fetchError);
      // Even though there was an error fetching the complete data, the startup was created
      return res.status(201).json({ 
        id: result.id, 
        message: 'Startup was created but complete data could not be fetched',
        error: fetchError.message
      });
    }
  } catch (error) {
    console.error('Unhandled error creating startup:', error);
    return res.status(500).json({ 
      error: 'Failed to create startup due to an unexpected error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all startups (public)
router.get('/', async (_req, res) => {
  try {
    console.log('Attempting to fetch all startups...');
    
    // Fetch all startups using db adapter
    const startups = await db.findMany('Startup');
    console.log(`Successfully fetched ${startups.length} startups`);
    
    // For each startup, get its roles, users and owner
    const transformedStartups = [];
    
    for (const startup of startups) {
      // Get the owner of this startup
      const owner = await db.findOne('users', { id: startup.ownerId });
      
      // Get roles for this startup
      const roles = await db.findMany('Role', { startupId: startup.id });
      
      // Get users for each role
      const rolesWithUsers = [];
      for (const role of roles) {
        // Find user_roles entries for this role
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM UserRole ur
          JOIN User u ON ur.userId = u.id
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
    const startups = await db.findMany('Startup', { ownerId: userId });
    console.log(`Found ${startups.length} owned startups for user ${userId}`);

    // For each startup, get its roles and members
    const transformedStartups = [];
    
    for (const startup of startups) {
      // Get roles for this startup
      const roles = await db.findMany('Role', { startupId: startup.id });
      
      // Get users for each role
      const rolesWithUsers = [];
      for (const role of roles) {
        // Find user_roles entries for this role
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM UserRole ur
          JOIN User u ON ur.userId = u.id
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
    const startups = await db.findMany('Startup', { ownerId: userId });
    console.log(`Found ${startups.length} owned startups`);

    // For each startup, get its roles and members
    const transformedStartups = [];
    
    for (const startup of startups) {
      // Get roles for this startup
      const roles = await db.findMany('Role', { startupId: startup.id });
      
      // Get users for each role
      const rolesWithUsers = [];
      for (const role of roles) {
        // Find user_roles entries for this role
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM UserRole ur
          JOIN User u ON ur.userId = u.id
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
    const startup = await db.findOne('Startup', { id });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    // Get the owner of this startup
    const owner = await db.findOne('users', { id: startup.ownerId });
    
    // Get roles for this startup
    const roles = await db.findMany('Role', { startupId: startup.id });
    
    // Get users for each role
    const rolesWithUsers = [];
    for (const role of roles) {
      // Find user_roles entries for this role
      const userRolesQuery = `
        SELECT ur.*, u.id as userId, u.name, u.email
        FROM UserRole ur
        JOIN User u ON ur.userId = u.id
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
    const { 
      name, 
      details, 
      stage, 
      location, 
      industry, 
      logoUrl, 
      bannerUrl, 
      website,
      deleteLogo,
      deleteBanner
    } = req.body;
    const userId = req.user.id;
    
    console.log('Attempting to update startup:', { 
      id, 
      userId,
      name, 
      details: details ? details.substring(0, 20) + '...' : undefined,
      stage, 
      location, 
      industry,
      website,
      deleteLogo,
      deleteBanner,
      hasFiles: req.files ? 'yes' : 'no',
      fileInfo: req.files ? {
        logo: req.files.logo ? `${req.files.logo.length} file(s)` : 'none',
        banner: req.files.banner ? `${req.files.banner.length} file(s)` : 'none'
      } : 'none'
    });
    
    // Check if startup exists and user is the owner
    const startup = await db.findOne('Startup', { id });
    
    if (!startup) {
      console.log('Startup not found with id:', id);
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    console.log('Found startup:', {
      id: startup.id,
      name: startup.name,
      ownerId: startup.ownerId,
      logo: startup.logo,
      banner: startup.banner
    });
    
    if (startup.ownerId !== userId) {
      console.log('Authorization failure - user is not owner:', {
        startupOwnerId: startup.ownerId,
        requestUserId: userId
      });
      return res.status(403).json({ error: 'You are not authorized to update this startup' });
    }
    
    // Prepare update data
    const updateData = {
      name: name || undefined,
      details: details || undefined,
      stage: stage || undefined,
      location: location || undefined,
      industry: industry || undefined,
      website: website
    };
    
    console.log('About to update startup with data:', updateData);
    
    // Handle logo deletion request
    if (deleteLogo === 'true') {
      console.log('Deleting logo file');
      updateData.logo = null;
      // Delete old logo file if exists and is not a URL
      if (startup.logo && startup.logo.startsWith('/uploads/')) {
        try {
          const oldLogoPath = path.join(__dirname, '..', startup.logo);
          console.log('Attempting to delete old logo at:', oldLogoPath);
          if (fs.existsSync(oldLogoPath)) {
            fs.unlinkSync(oldLogoPath);
            console.log('Old logo file deleted successfully');
          } else {
            console.log('Old logo file not found at:', oldLogoPath);
          }
        } catch (deleteErr) {
          console.error('Error deleting old logo file:', deleteErr);
          // Continue with update even if old file deletion fails
        }
      }
    }
    // Handle logo file upload if not deleted
    else if (req.files && req.files.logo && req.files.logo.length > 0) {
      const logoFilePath = `/uploads/${req.files.logo[0].filename}`;
      console.log('New logo file uploaded:', req.files.logo[0].filename);
      console.log('Setting logo path to:', logoFilePath);
      updateData.logo = logoFilePath;
      
      // Delete old logo file if exists and is not a URL
      if (startup.logo && startup.logo.startsWith('/uploads/')) {
        try {
          const oldLogoPath = path.join(__dirname, '..', startup.logo);
          console.log('Attempting to delete old logo at:', oldLogoPath);
          if (fs.existsSync(oldLogoPath)) {
            fs.unlinkSync(oldLogoPath);
            console.log('Old logo file deleted successfully');
          } else {
            console.log('Old logo file not found at:', oldLogoPath);
          }
        } catch (deleteErr) {
          console.error('Error deleting old logo file:', deleteErr);
          // Continue with update even if old file deletion fails
        }
      }
    } else if (logoUrl && !deleteLogo) {
      // If no new file but URL provided, use URL
      console.log('Using provided logoUrl:', logoUrl);
      updateData.logo = logoUrl;
    }
    
    // Handle banner deletion request
    if (deleteBanner === 'true') {
      console.log('Deleting banner file');
      updateData.banner = null;
      // Delete old banner file if exists and is not a URL
      if (startup.banner && startup.banner.startsWith('/uploads/')) {
        try {
          const oldBannerPath = path.join(__dirname, '..', startup.banner);
          console.log('Attempting to delete old banner at:', oldBannerPath);
          if (fs.existsSync(oldBannerPath)) {
            fs.unlinkSync(oldBannerPath);
            console.log('Old banner file deleted successfully');
          } else {
            console.log('Old banner file not found at:', oldBannerPath);
          }
        } catch (deleteErr) {
          console.error('Error deleting old banner file:', deleteErr);
          // Continue with update even if old file deletion fails
        }
      }
    }
    // Handle banner file upload if not deleted
    else if (req.files && req.files.banner && req.files.banner.length > 0) {
      const bannerFilePath = `/uploads/${req.files.banner[0].filename}`;
      console.log('New banner file uploaded:', req.files.banner[0].filename);
      console.log('Setting banner path to:', bannerFilePath);
      updateData.banner = bannerFilePath;
      
      // Delete old banner file if exists and is not a URL
      if (startup.banner && startup.banner.startsWith('/uploads/')) {
        try {
          const oldBannerPath = path.join(__dirname, '..', startup.banner);
          console.log('Attempting to delete old banner at:', oldBannerPath);
          if (fs.existsSync(oldBannerPath)) {
            fs.unlinkSync(oldBannerPath);
            console.log('Old banner file deleted successfully');
          } else {
            console.log('Old banner file not found at:', oldBannerPath);
          }
        } catch (deleteErr) {
          console.error('Error deleting old banner file:', deleteErr);
          // Continue with update even if old file deletion fails
        }
      }
    } else if (bannerUrl && !deleteBanner) {
      // If no new file but URL provided, use URL
      console.log('Using provided bannerUrl:', bannerUrl);
      updateData.banner = bannerUrl;
    }
    
    try {
      // Update startup
      const updatedStartup = await db.update('Startup', id, updateData);
      console.log('Startup successfully updated:', {
        id: updatedStartup.id,
        name: updatedStartup.name,
        logo: updatedStartup.logo,
        banner: updatedStartup.banner
      });
      
      // Get full startup details for response
      const completeStartup = await getCompleteStartupData(updatedStartup.id);
      return res.json(completeStartup);
    } catch (updateError) {
      console.error('Error updating startup data:', updateError);
      return res.status(500).json({ error: 'Failed to update startup', details: updateError.message });
    }
  } catch (error) {
    console.error('Error updating startup:', error);
    return res.status(500).json({ error: 'Failed to update startup', details: error.message });
  }
});

// Get all members of a startup
router.get('/:startupId/members', authMiddleware, async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Check if startup exists
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Get all members (owner + people with accepted roles)
    const owner = await db.findOne('users', { id: startup.ownerId });
    
    // Get all roles for this startup
    const roles = await db.findMany('Role', { startupId });
    const roleIds = roles.map(role => role.id);
    
    // Now get all user roles for these role IDs
    let roleMembers = [];
    if (roleIds.length > 0) {
      // MySQL doesn't handle array parameters correctly with IN clause
      // We need to construct the query differently
      const placeholders = roleIds.map(() => '?').join(',');
      const query = `
        SELECT ur.userId, u.name, u.email
        FROM UserRole ur
        JOIN User u ON ur.userId = u.id
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
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // First get all roles for this startup
    const roles = await db.findMany('Role', { startupId });
    const roleIds = roles.map(role => role.id);
    
    // Now fetch members with roles using a single query
    let members = [];
    if (roleIds.length > 0) {
      // MySQL doesn't handle array parameters correctly with IN clause
      // We need to construct the query differently
      const placeholders = roleIds.map(() => '?').join(',');
      const query = `
        SELECT ur.userId, ur.roleId, u.name, u.email, r.title, r.roleType
        FROM UserRole ur
        JOIN User u ON ur.userId = u.id
        JOIN Role r ON ur.roleId = r.id
        JOIN Startup s ON r.startupId = s.id
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
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Check if user is the owner or an admin
    const isOwner = startup.ownerId === requestingUserId;
    
    if (!isOwner) {
      // Get all roles for this startup
      const roles = await db.findMany('Role', { startupId });
      const roleIds = roles.map(role => role.id);
      
      // Check if the requesting user has an admin role
      let isAdmin = false;
      if (roleIds.length > 0) {
        // MySQL doesn't handle array parameters correctly with IN clause
        // We need to construct the query differently
        const placeholders = roleIds.map(() => '?').join(',');
        const query = `
          SELECT ur.id, r.roleType
          FROM UserRole ur
          JOIN Role r ON ur.roleId = r.id
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
    const role = await db.findOne('Role', { id: roleId, startupId });
    
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
    const existingUserRole = await db.findOne('UserRole', { userId, roleId });
    
    if (existingUserRole) {
      // Update the existing user role
      await db.update('UserRole', existingUserRole.id, { roleId });
    } else {
      // Create a new user role
      await db.create('UserRole', { userId, roleId, startupId });
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
    const startup = await db.findOne('Startup', { id });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to add roles to this startup' });
    }
    
    // Create the new roles
    const createdRoles = await Promise.all(
      roles.map(role => 
        db.create('Role', {
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
    const updatedStartup = await db.findOne('Startup', { id });
    
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
    const role = await db.findOne('Role', { id: roleId });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if the user is the startup owner
    const startup = await db.findOne('Startup', { id: role.startupId });
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this role' });
    }
    
    // Update the role
    const updatedRole = await db.update('Role', roleId, {
      title: title || undefined,
      roleType: roleType || undefined,
      isOpen: isOpen !== undefined ? isOpen : undefined
    });
    
    // Get users assigned to this role
    const userRolesQuery = `
      SELECT u.id, u.name, u.email
      FROM UserRole ur
      JOIN User u ON ur.userId = u.id
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
    const role = await db.findOne('Role', { id: roleId });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Check if the user is the startup owner
    const startup = await db.findOne('Startup', { id: role.startupId });
    if (startup.ownerId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this role' });
    }
    
    // Check if the role has assigned users
    const userRolesQuery = `
      SELECT COUNT(*) as count
      FROM UserRole
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
    await db.delete('Role', { id: roleId });
    
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
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }
    
    // Get all roles for this startup
    const rolesQuery = 'SELECT id, title, roleType, isOpen, isPaid FROM Role WHERE startupId = ?';
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
    const startup = await db.findOne('Startup', { id: startupId });
    
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
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
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
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
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

// Public preview endpoint - no auth required
router.get('/:startupId/public-preview', async (req, res) => {
  try {
    const { startupId } = req.params;
    
    // Get basic startup info
    const startup = await db.findOne('Startup', { id: startupId });
    
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }
    
    // Return only public information
    const publicInfo = {
      id: startup.id,
      name: startup.name,
      description: startup.details,
      logo: startup.logo,
      industry: startup.industry,
      location: startup.location
    };
    
    res.json(publicInfo);
  } catch (error) {
    console.error('Error fetching public startup preview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
module.exports.default = router; 