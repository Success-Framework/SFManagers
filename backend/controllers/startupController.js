import { v4 as uuidv4 } from 'uuid';    
import { db } from '../database.js'; // Ensure the correct file extension is used
import path from 'path';
import fs from 'fs';

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

// POST create startup
export const createStartup = async (req, res) => {
  try {
    const { name, description, location, industry, mission, vision } = req.body;
    let roles = [];
    
    if (req.body.roles) {
      try {
        roles = JSON.parse(req.body.roles);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid roles format' });
      }
    }
    
    const userId = req.user.id;
    
    if (!name || !description || !roles || !Array.isArray(roles) || roles.length === 0 || roles.length > 5) {
      return res.status(400).json({ 
        error: 'Invalid input. Please provide name, description, and between 1-5 roles.' 
      });
    }
    
    for (const role of roles) {
      if (!role.title || !role.roleType) {
        return res.status(400).json({
          error: 'Each role must have a title and role type.'
        });
      }
    }
    
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
    
    const startupData = {
      id: uuidv4(),
      name,
      details: description,
      stage: 'Idea',
      logo: logoPath,
      banner: bannerPath,
      location: location || null,
      industry: industry || null,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.transaction(async (dbTx) => {
      const startup = await dbTx.create('Startup', startupData);
      
      for (const role of roles) {
        await dbTx.create('Role', {
          id: uuidv4(),
          title: role.title,
          roleType: role.roleType,
          isPaid: role.isPaid || false,
          isOpen: true,
          startupId: startup.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await dbTx.query(
        'INSERT INTO startup_members (id, userId, startupId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userId, startup.id, new Date(), new Date()]
      );
      
      return startup;
    });
    
    const createdStartup = await getCompleteStartupData(result.id);
    return res.status(201).json(createdStartup);
  } catch (error) {
    console.error('Error creating startup:', error);
    return res.status(500).json({ error: 'Failed to create startup' });
  }
};

// GET all startups (public)
export const getAllStartups = async (_req, res) => {
  try {
    const startups = await db.findMany('Startup');
    
    const transformedStartups = [];
    
    for (const startup of startups) {
      const owner = await db.findOne('users', { id: startup.ownerId });
      const roles = await db.findMany('Role', { startupId: startup.id });
      
      const rolesWithUsers = await Promise.all(roles.map(async (role) => {
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM UserRole ur
          JOIN User u ON ur.userId = u.id
          WHERE ur.roleId = ?
        `;
        const userRoles = await db.raw(userRolesQuery, [role.id]);
        return {
          ...role,
          users: userRoles.map(ur => ({
            id: ur.userId,
            name: ur.name,
            email: ur.email
          }))
        };
      }));
      
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
    
    return res.json(transformedStartups);
  } catch (error) {
    console.error('Detailed error fetching startups:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch startups',
      details: error?.message,
      code: error?.code
    });
  }
};

// GET startups owned by userId param
export const getOwnedStartupsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const startups = await db.findMany('Startup', { ownerId: userId });
    
    const transformedStartups = [];
    
    for (const startup of startups) {
      const roles = await db.findMany('Role', { startupId: startup.id });
      const rolesWithUsers = await Promise.all(roles.map(async (role) => {
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM UserRole ur
          JOIN User u ON ur.userId = u.id
          WHERE ur.roleId = ?
        `;
        const userRoles = await db.raw(userRolesQuery, [role.id]);
        return {
          ...role,
          users: userRoles.map(ur => ({
            id: ur.userId,
            name: ur.name,
            email: ur.email
          }))
        };
      }));
      
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
};

// GET startups owned by authenticated user
export const getMyStartups = async (req, res) => {
  try {
    const userId = req.user.id;
    const startups = await db.findMany('Startup', { ownerId: userId });
    
    const transformedStartups = [];
    
    for (const startup of startups) {
      const roles = await db.findMany('Role', { startupId: startup.id });
      const rolesWithUsers = await Promise.all(roles.map(async (role) => {
        const userRolesQuery = `
          SELECT ur.*, u.id as userId, u.name, u.email
          FROM UserRole ur
          JOIN User u ON ur.userId = u.id
          WHERE ur.roleId = ?
        `;
        const userRoles = await db.raw(userRolesQuery, [role.id]);
        return {
          ...role,
          users: userRoles.map(ur => ({
            id: ur.userId,
            name: ur.name,
            email: ur.email
          }))
        };
      }));
      
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
};

// Get startup by ID
export const getStartupById = async (req, res) => {
  try {
    const { id } = req.params;

    const startup = await db.findOne('Startup', { id });
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    const owner = await db.findOne('users', { id: startup.ownerId });

    const roles = await db.findMany('Role', { startupId: startup.id });
    const rolesWithUsers = [];

    for (const role of roles) {
      const userRolesQuery = `
        SELECT ur.*, u.id as userId, u.name, u.email
        FROM UserRole ur
        JOIN User u ON ur.userId = u.id
        WHERE ur.roleId = ?
      `;
      const userRoles = await db.raw(userRolesQuery, [role.id]);

      rolesWithUsers.push({
        ...role,
        assignedUser: userRoles.length > 0 ? {
          id: userRoles[0].userId,
          name: userRoles[0].name,
          email: userRoles[0].email,
        } : undefined,
      });
    }

    const transformedStartup = {
      ...startup,
      roles: rolesWithUsers,
      owner: owner ? {
        id: owner.id,
        name: owner.name,
        email: owner.email,
      } : null,
    };

    return res.json(transformedStartup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    return res.status(500).json({ error: 'Failed to fetch startup' });
  }
};

// Update a startup
export const updateStartup = async (req, res) => {
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
      deleteBanner,
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
        banner: req.files.banner ? `${req.files.banner.length} file(s)` : 'none',
      } : 'none',
    });

    const startup = await db.findOne('Startup', { id });

    if (!startup) {
      console.log('Startup not found with id:', id);
      return res.status(404).json({ error: 'Startup not found' });
    }

    if (startup.ownerId !== userId) {
      console.log('Authorization failure - user is not owner:', {
        startupOwnerId: startup.ownerId,
        requestUserId: userId,
      });
      return res.status(403).json({ error: 'You are not authorized to update this startup' });
    }

    const updateData = {
      name: name || undefined,
      details: details || undefined,
      stage: stage || undefined,
      location: location || undefined,
      industry: industry || undefined,
      website: website,
    };

    // --- Logo Handling ---
    if (deleteLogo === 'true') {
      updateData.logo = null;
      if (startup.logo && startup.logo.startsWith('/uploads/')) {
        try {
          const oldLogoPath = path.join(__dirname, '..', startup.logo);
          if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
        } catch (err) {
          console.error('Error deleting old logo file:', err);
        }
      }
    } else if (req.files && req.files.logo && req.files.logo.length > 0) {
      const logoFilePath = `/uploads/${req.files.logo[0].filename}`;
      updateData.logo = logoFilePath;
      if (startup.logo && startup.logo.startsWith('/uploads/')) {
        try {
          const oldLogoPath = path.join(__dirname, '..', startup.logo);
          if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
        } catch (err) {
          console.error('Error deleting old logo file:', err);
        }
      }
    } else if (logoUrl && !deleteLogo) {
      updateData.logo = logoUrl;
    }

    // --- Banner Handling ---
    if (deleteBanner === 'true') {
      updateData.banner = null;
      if (startup.banner && startup.banner.startsWith('/uploads/')) {
        try {
          const oldBannerPath = path.join(__dirname, '..', startup.banner);
          if (fs.existsSync(oldBannerPath)) fs.unlinkSync(oldBannerPath);
        } catch (err) {
          console.error('Error deleting old banner file:', err);
        }
      }
    } else if (req.files && req.files.banner && req.files.banner.length > 0) {
      const bannerFilePath = `/uploads/${req.files.banner[0].filename}`;
      updateData.banner = bannerFilePath;
      if (startup.banner && startup.banner.startsWith('/uploads/')) {
        try {
          const oldBannerPath = path.join(__dirname, '..', startup.banner);
          if (fs.existsSync(oldBannerPath)) fs.unlinkSync(oldBannerPath);
        } catch (err) {
          console.error('Error deleting old banner file:', err);
        }
      }
    } else if (bannerUrl && !deleteBanner) {
      updateData.banner = bannerUrl;
    }

    const updatedStartup = await db.update('Startup', id, updateData);

    const completeStartup = await getCompleteStartupData(updatedStartup.id);
    return res.json(completeStartup);

  } catch (error) {
    console.error('Error updating startup:', error);
    return res.status(500).json({ error: 'Failed to update startup', details: error.message });
  }
};

// Get startup members
export const getStartupMembers = async (req, res) => {
  try {
    const { startupId } = req.params;
    const startup = await db.findOne('Startup', { id: startupId });
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }

    const owner = await db.findOne('users', { id: startup.ownerId });
    const roles = await db.findMany('Role', { startupId });
    const roleIds = roles.map(role => role.id);

    let roleMembers = [];
    if (roleIds.length > 0) {
      const placeholders = roleIds.map(() => '?').join(',');
      const query = `
        SELECT ur.userId, u.name, u.email
        FROM UserRole ur
        JOIN User u ON ur.userId = u.id
        WHERE ur.roleId IN (${placeholders})
      `;
      roleMembers = await db.raw(query, roleIds);
    }

    const members = [
      {
        id: owner.id,
        name: owner.name,
        email: owner.email
      },
      ...roleMembers.map(m => ({
        id: m.userId,
        name: m.name,
        email: m.email
      }))
    ].filter((member, index, self) => 
      index === self.findIndex(m => m.id === member.id)
    );

    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Get members with roles
export const getMembersWithRoles = async (req, res) => {
  try {
    const { startupId } = req.params;
    const startup = await db.findOne('Startup', { id: startupId });
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }

    const roles = await db.findMany('Role', { startupId });
    const roleIds = roles.map(role => role.id);

    let members = [];
    if (roleIds.length > 0) {
      const placeholders = roleIds.map(() => '?').join(',');
      const query = `
        SELECT ur.userId, ur.roleId, u.name, u.email, r.title, r.roleType
        FROM UserRole ur
        JOIN User u ON ur.userId = u.id
        JOIN Role r ON ur.roleId = r.id
        WHERE ur.roleId IN (${placeholders})
      `;
      const userRoles = await db.raw(query, roleIds);

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
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { startupId, userId } = req.params;
    const { roleId } = req.body;
    const requestingUserId = req.user.id;

    if (!roleId) {
      return res.status(400).json({ msg: 'Role ID is required' });
    }

    const startup = await db.findOne('Startup', { id: startupId });
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }

    const isOwner = startup.ownerId === requestingUserId;

    if (!isOwner) {
      const roles = await db.findMany('Role', { startupId });
      const roleIds = roles.map(role => role.id);

      let isAdmin = false;
      if (roleIds.length > 0) {
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

    const role = await db.findOne('Role', { id: roleId, startupId });
    if (!role) {
      return res.status(404).json({ msg: 'Role not found in this startup' });
    }

    const targetUser = await db.findOne('users', { id: userId });
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (userId === startup.ownerId) {
      return res.status(403).json({ msg: 'Cannot change the role of the startup owner' });
    }

    const existingUserRole = await db.findOne('UserRole', { userId, roleId });

    if (existingUserRole) {
      await db.update('UserRole', existingUserRole.id, { roleId });
    } else {
      await db.create('UserRole', { userId, roleId, startupId });
    }

    res.json({ msg: 'User role updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export const addRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    const userId = req.user.id;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Invalid input. Please provide at least one role.' });
    }

    for (const role of roles) {
      if (!role.title || !role.roleType) {
        return res.status(400).json({ error: 'Each role must have a title and role type.' });
      }
    }

    const startup = await db.findOne('Startup', { id });
    if (!startup) return res.status(404).json({ error: 'Startup not found' });
    if (startup.ownerId !== userId) return res.status(403).json({ error: 'Not authorized to add roles' });

    const createdRoles = await Promise.all(
      roles.map(role =>
        db.create('Role', {
          id: uuidv4(),
          title: role.title,
          roleType: role.roleType,
          isOpen: role.isOpen !== undefined ? role.isOpen : true,
          startupId: id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      )
    );

    const updatedStartup = await db.findOne('Startup', { id });
    const transformedStartup = {
      ...updatedStartup,
      roles: createdRoles.map(role => ({ ...role, assignedUser: null }))
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
};

// Edit a role (owner only)
export const editRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { title, roleType, isOpen } = req.body;
    const userId = req.user.id;

    const role = await db.findOne('Role', { id: roleId });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const startup = await db.findOne('Startup', { id: role.startupId });
    if (startup.ownerId !== userId) return res.status(403).json({ error: 'Not authorized to edit this role' });

    const updatedRole = await db.update('Role', roleId, {
      title: title || undefined,
      roleType: roleType || undefined,
      isOpen: isOpen !== undefined ? isOpen : undefined
    });

    const userRolesQuery = `
      SELECT u.id, u.name, u.email
      FROM UserRole ur
      JOIN User u ON ur.userId = u.id
      WHERE ur.roleId = ?
      LIMIT 1
    `;
    const userRoles = await db.raw(userRolesQuery, [roleId]);

    const assignedUser = userRoles.length > 0 ? {
      id: userRoles[0].id,
      name: userRoles[0].name,
      email: userRoles[0].email
    } : undefined;

    return res.json({
      message: 'Role updated successfully',
      role: { ...updatedRole, assignedUser }
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return res.status(500).json({ error: 'Failed to update role' });
  }
};

// Delete a role (owner only)
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const userId = req.user.id;

    const role = await db.findOne('Role', { id: roleId });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const startup = await db.findOne('Startup', { id: role.startupId });
    if (startup.ownerId !== userId) return res.status(403).json({ error: 'Not authorized to delete this role' });

    const userRolesQuery = `
      SELECT COUNT(*) as count
      FROM UserRole
      WHERE roleId = ?
    `;
    const userRolesCount = await db.raw(userRolesQuery, [roleId]);

    if (userRolesCount[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete a role with assigned users. Remove users first.' });
    }

    await db.deleteMany('join_requests', { roleId });
    await db.delete('Role', { id: roleId });

    return res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    return res.status(500).json({ error: 'Failed to delete role' });
  }
};

// Get roles for a specific startup
export const getRoles = async (req, res) => {
  try {
    const { startupId } = req.params;

    const startup = await db.findOne('Startup', { id: startupId });
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }

    const rolesQuery = 'SELECT id, title, roleType, isOpen, isPaid FROM Role WHERE startupId = ?';
    const roles = await db.raw(rolesQuery, [startupId]);

    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

// Get user roles for a specific startup
export const getUserRoles = async (req, res) => {
  try {
    const { startupId } = req.params;
    const userId = req.user.id;

    const startup = await db.findOne('Startup', { id: startupId });
    if (!startup) {
      return res.status(404).json({ msg: 'Startup not found' });
    }

    const isOwner = startup.ownerId === userId;

    if (isOwner) {
      return res.json([{
        role: {
          id: 'owner',
          title: 'Founder',
          roleType: 'Admin'
        }
      }]);
    }

    const userRolesQuery = `
      SELECT r.id, r.title, r.roleType 
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ? AND r.startupId = ?
    `;
    const userRoles = await db.raw(userRolesQuery, [userId, startupId]);

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
};

// Get startups where the user has joined roles
export const getJoinedStartups = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching joined startups for user:', userId);

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

      const startup = startupMap.get(startupId);
      startup.roles.push({
        id: row.roleId,
        title: row.roleTitle,
        roleType: row.roleType,
        isPaid: row.isPaid === 1,
        description: row.roleDescription,
        isOpen: row.isOpen === 1,
        createdAt: row.roleCreatedAt,
        updatedAt: row.roleUpdatedAt,
        users: [{ id: userId }]
      });
    });

    const joinedStartups = Array.from(startupMap.values());

    return res.json(joinedStartups);
  } catch (error) {
    console.error('Error fetching joined startups:', error);
    return res.status(500).json({ error: 'Failed to fetch joined startups' });
  }
};

// Public preview (no auth)
export const publicPreview = async (req, res) => {
  try {
    const { startupId } = req.params;

    const startup = await db.findOne('Startup', { id: startupId });

    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

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
};

