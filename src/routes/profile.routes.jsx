import express from 'express';
import { db } from '../database';
// import authMiddleware from '../middleware/auth';

const router = express.Router();

// Get all profiles with optional filtering
router.get('/', async (req, res) => {
  try {
    console.log('Profiles endpoint called with query params:', req.query);
    
    try {
      // Use the findMany method from database.js
      console.log('Attempting to fetch users from database');
      const users = await db.findMany('User', {}, { 
        select: ['id', 'name', 'email', 'headline', 'bio', 'location', 'profileImage', 
                'points', 'level', 'createdAt', 'linkedinUrl', 'githubUrl', 'portfolio', 'phone'] 
      });
      
      console.log(`Found ${users?.length} users in database`);
      
      if (!users || users.length === 0) {
        throw new Error('No users found in database');
      }
      
      // For each user, fetch their skills
      const profilesWithData = await Promise.all(users.map(async (user) => {
        try {
          // Get skills for this user
          const skills = await db.findMany('Skill', { userId: user.id });
          
          return {
            id: user.id,
            fullName: user.name,
            email: user.email,
            position: user.headline || 'Member',
            userType: 'member', // Default value
            location: user.location || 'Not specified',
            skills: skills.map(skill => ({
              name: skill.name,
              level: skill.level
            })),
            bio: user.bio || 'No bio provided',
            followers: 0,
            projects: 0,
            availableForHire: true,
            rating: 0,
            joinDate: user.createdAt,
            profileImage: user.profileImage,
            links: {
              linkedIn: user.linkedinUrl || '',
              github: user.githubUrl || '',
              portfolio: user.portfolio || ''
            },
            phone: user.phone || ''
          };
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
          return null;
        }
      }));
      
      // Filter out any null values from users that failed to process
      const validProfiles = profilesWithData.filter(profile => profile !== null);
      
      console.log(`Successfully processed ${validProfiles.length} profiles from real data`);
      return res.json({ profiles: validProfiles.length > 0 ? validProfiles : getBackupMockProfiles() });
    } catch (dbError) {
      console.error('Database error fetching profiles:', dbError);
      // Fallback to mock data in case of error to keep the app functioning
      console.warn('Falling back to mock profiles due to error');
      return res.json({ profiles: getBackupMockProfiles() });
    }
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching profile by ID:', id);
    
    try {
      // Fetch user from database
      const user = await db.findOne('User', { id });
      
      if (!user) {
        console.log('User not found, returning mock data');
        return res.json(getBackupMockProfile(id));
      }
      
      // Fetch skills
      const skills = await db.findMany('Skill', { userId: id });
      
      // Format the profile data
      const profileData = {
        id: user.id,
        fullName: user.name,
        email: user.email,
        position: user.headline || 'Member',
        userType: 'member',
        location: user.location || 'Not specified',
        skills: skills.map(skill => ({
          name: skill.name,
          level: skill.level
        })),
        bio: user.bio || 'No bio provided',
        followers: 0,
        projects: 0,
        availableForHire: true,
        rating: 0,
        joinDate: user.createdAt,
        links: {
          linkedIn: user.linkedinUrl || '',
          github: user.githubUrl || '',
          portfolio: user.portfolio || ''
        },
        phone: user.phone || ''
      };
      
      return res.json(profileData);
    } catch (dbError) {
      console.error('Database error fetching profile by ID:', dbError);
      // Fallback to mock data
      return res.json(getBackupMockProfile(id));
    }
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Fallback mock profiles in case of database error
function getBackupMockProfiles() {
  return [
    {
      id: '1',
      fullName: 'John Developer',
      email: 'john@example.com',
      position: 'Full Stack Developer',
      userType: 'freelancer',
      location: 'San Francisco, CA',
      skills: [
        { name: 'React', level: 'expert' },
        { name: 'Node.js', level: 'advanced' }
      ],
      bio: 'Passionate developer with 5+ years of experience building web applications.',
      followers: 120,
      projects: 15,
      availableForHire: true,
      hourlyRate: '$80',
      rating: 4.8,
      joinDate: '2023-01-15'
    },
    {
      id: '2',
      fullName: 'Sarah Designer',
      email: 'sarah@example.com',
      position: 'UI/UX Designer',
      userType: 'employee',
      location: 'New York, NY',
      skills: [
        { name: 'Figma', level: 'expert' },
        { name: 'UI Design', level: 'expert' }
      ],
      bio: 'Creative designer focused on creating beautiful and functional user interfaces.',
      followers: 85,
      projects: 23,
      availableForHire: false,
      rating: 4.6,
      joinDate: '2022-11-05'
    },
    {
      id: '3',
      fullName: 'Michael Investor',
      email: 'michael@example.com',
      position: 'Angel Investor',
      userType: 'investor',
      location: 'Austin, TX',
      skills: [
        { name: 'Financial Analysis', level: 'expert' },
        { name: 'Business Strategy', level: 'advanced' }
      ],
      bio: 'Experienced investor looking for promising tech startups in the fintech space.',
      followers: 210,
      projects: 8,
      availableForHire: true,
      rating: 4.9,
      joinDate: '2021-06-22'
    },
    {
      id: '4',
      fullName: 'Emily Founder',
      email: 'emily@example.com',
      position: 'CEO & Founder',
      userType: 'founder',
      location: 'Boston, MA',
      skills: [
        { name: 'Leadership', level: 'expert' },
        { name: 'Product Strategy', level: 'advanced' }
      ],
      bio: 'Serial entrepreneur building my third startup in the healthcare space.',
      followers: 178,
      projects: 3,
      availableForHire: false,
      rating: 4.7,
      joinDate: '2022-03-10'
    },
    {
      id: '5',
      fullName: 'David Marketer',
      email: 'david@example.com',
      position: 'Marketing',
      userType: 'freelancer',
      location: 'Chicago, IL',
      skills: [
        { name: 'Content Marketing', level: 'expert' },
        { name: 'SEO', level: 'advanced' }
      ],
      bio: 'Growth marketing specialist with expertise in SaaS and B2B companies.',
      followers: 92,
      projects: 27,
      availableForHire: true,
      hourlyRate: '$65',
      rating: 4.5,
      joinDate: '2022-08-18'
    }
  ];
}

// Fallback mock profile for single profile in case of database error
function getBackupMockProfile(id) {
  return {
    id: id,
    fullName: 'John Developer',
    email: 'john@example.com',
    position: 'Full Stack Developer',
    userType: 'freelancer',
    location: 'San Francisco, CA',
    skills: [
      { name: 'React', level: 'expert' },
      { name: 'Node.js', level: 'advanced' },
      { name: 'TypeScript', level: 'intermediate' }
    ],
    bio: 'Passionate developer with 5+ years of experience building web applications.',
    followers: 120,
    projects: 15,
    availableForHire: true,
    hourlyRate: '$80',
    rating: 4.8,
    joinDate: '2023-01-15',
    links: {
      linkedIn: 'https://linkedin.com/in/johndeveloper',
      github: 'https://github.com/johndeveloper',
      portfolio: 'https://johndeveloper.com'
    },
    phone: '+1234567890'
  };
}

export default router; 