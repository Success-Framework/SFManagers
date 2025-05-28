import { db } from '../database.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') 
      ? cb(null, true) 
      : cb(new Error('Only image files are allowed!'), false);
  }
});

// Helper function to determine user type
const getUserType = (user) => {
  if (user.joinedRoles?.some(role => role.role?.name?.toLowerCase().includes('founder'))) {
    return 'founder';
  }
  
  if (user.skills?.some(skill => skill.name.toLowerCase().includes('invest')) ||
      user.headline?.toLowerCase().includes('invest')) {
    return 'investor';
  }
  
  if (user.availability || user.hourlyRate || 
      user.headline?.toLowerCase().includes('freelance')) {
    return 'freelancer';
  }
  
  return 'employee';
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching profile for user:', userId);

    const [user] = await db.raw(`
      SELECT id, email, name, headline, bio, location, profileImage,
             linkedinUrl, githubUrl, portfolio, phone, points, level,
             createdAt, updatedAt
      FROM User 
      WHERE id = ?`, 
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [skills] = await db.raw(
      'SELECT id, name, level FROM Skill WHERE userId = ?',
      [userId]
    );

    const [education] = await db.raw(`
      SELECT id, institution, degree, fieldOfStudy, startDate, endDate, description 
      FROM Education 
      WHERE userId = ? 
      ORDER BY startDate DESC`,
      [userId]
    );

    const [experience] = await db.raw(`
      SELECT id, title, company, startDate, endDate, current, description 
      FROM Experience 
      WHERE userId = ? 
      ORDER BY startDate DESC`,
      [userId]
    );

    const [pointsHistory] = await db.raw(`
      SELECT id, points, description, createdAt 
      FROM PointsTransaction 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT 10`,
      [userId]
    );

    // Format dates
    const formatDates = (items) => items?.map(item => ({
      ...item,
      startDate: item.startDate?.toISOString(),
      endDate: item.endDate?.toISOString()
    }));

    const userData = {
      ...user,
      skills: skills || [],
      education: formatDates(education) || [],
      experience: formatDates(experience) || [],
      pointsHistory: pointsHistory || []
    };

    return res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user profile',
      details: error.message 
    });
  }
};

export const addExperience = async (req, res) => {
  try {
    const { title, company, startDate, endDate, current, description } = req.body;
    const userId = req.user.id;

    if (!title || !company || !startDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    
    const safeDescription = description || 'No description provided';
    const formattedEndDate = current ? null : (endDate ? new Date(endDate) : null);

    const [result] = await db.raw(
      `INSERT INTO Experience (
        title, company, description, startDate, endDate, current, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, company, safeDescription, new Date(startDate), formattedEndDate, !!current, userId]
    );

    const [[experience]] = await db.raw(
      'SELECT * FROM Experience WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      ...experience,
      startDate: experience.startDate?.toISOString(),
      endDate: experience.endDate?.toISOString()
    });
  } catch (error) {
    console.error('Error adding experience:', error);
    return res.status(500).json({ 
      error: 'Failed to add experience',
      details: error.message
    });
  }
};

export const getFreelancers = async (req, res) => {
  try {
    const [freelancers] = await db.raw(`
      SELECT u.id, u.name, u.email, u.profilePicture, 
             COUNT(t.id) as taskCount
      FROM User u
      LEFT JOIN Task t ON u.id = t.freelancerId AND t.isFreelance = 1
      WHERE u.isFreelancer = 1 OR u.role = 'freelancer'
      GROUP BY u.id
      ORDER BY u.name ASC`
    );
    
    return res.json(freelancers);
  } catch (error) {
    console.error('Error fetching freelancers:', error);
    return res.status(500).json({ error: 'Server Error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const [user] = await db.raw('SELECT * FROM User WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [ownedStartups] = await db.raw(
      'SELECT * FROM Startup WHERE ownerId = ?',
      [userId]
    );

    const [joinedRoles] = await db.raw(`
      SELECT ur.*, r.*, s.* 
      FROM UserRole ur
      JOIN Role r ON ur.roleId = r.id
      JOIN Startup s ON r.startupId = s.id
      WHERE ur.userId = ?`,
      [userId]
    );

    const formattedJoinedRoles = joinedRoles?.map(row => ({
      ...row,
      role: {
        ...row,
        startup: {
          id: row.startupId,
          name: row.name,
          details: row.details,
          stage: row.stage,
          logo: row.logo,
          banner: row.banner,
          location: row.location,
          industry: row.industry,
          ownerId: row.ownerId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }
      }
    }));

    const { password, ...userData } = {
      ...user,
      ownedStartups: ownedStartups || [],
      joinedRoles: formattedJoinedRoles || []
    };

    return res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

export const getProfiles = async (req, res) => {
  try {
    const { userType, position, available } = req.query;
    
    const [users] = await db.raw(`
      SELECT id, email, name, headline, bio, location, profileImage,
             role, availability, createdAt
      FROM User
      LIMIT 50`
    );

    const userIds = users.map(user => user.id);
    const [skills] = userIds.length > 0 
      ? await db.raw(
          `SELECT userId, name, level FROM Skill WHERE userId IN (${userIds.map(() => '?').join(',')})`,
          userIds
        )
      : [[]];

    const skillsByUser = skills.reduce((acc, skill) => {
      acc[skill.userId] = acc[skill.userId] || [];
      acc[skill.userId].push({ name: skill.name, level: skill.level });
      return acc;
    }, {});

    const profiles = users.map(user => ({
      id: user.id,
      fullName: user.name || 'Anonymous User',
      email: user.email || '',
      position: user.headline || 'Member',
      userType: getUserType(user),
      location: user.location || '',
      avatarUrl: user.profileImage || null,
      bio: user.bio || '',
      skills: skillsByUser[user.id] || [],
      followers: 0,
      projects: 0,
      availableForHire: !!user.availability,
      hourlyRate: '$80',
      availability: user.availability || null,
      rating: 4.5,
      joinDate: user.createdAt?.toString() || new Date().toISOString()
    }));

    return res.json({ profiles });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};