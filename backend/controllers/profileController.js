import { db } from '../database.js';

// Helper functions
const getBackupMockProfiles = () => {
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
    // ... other mock profiles
  ];
};

const getBackupMockProfile = (id) => {
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
};

const formatProfileData = (user, skills) => {
  return {
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
    profileImage: user.profileImage,
    links: {
      linkedIn: user.linkedinUrl || '',
      github: user.githubUrl || '',
      portfolio: user.portfolio || ''
    },
    phone: user.phone || ''
  };
};

// Controller functions
export const getAllProfiles = async (req, res) => {
  try {
    console.log('Profiles endpoint called with query params:', req.query);
    
    try {
      console.log('Attempting to fetch users from database');
      const users = await db.findMany('User', {}, { 
        select: ['id', 'name', 'email', 'headline', 'bio', 'location', 'profileImage', 
                'points', 'level', 'createdAt', 'linkedinUrl', 'githubUrl', 'portfolio', 'phone'] 
      });
      
      console.log(`Found ${users?.length} users in database`);
      
      if (!users || users.length === 0) {
        throw new Error('No users found in database');
      }
      
      const profilesWithData = await Promise.all(users.map(async (user) => {
        try {
          const skills = await db.findMany('Skill', { userId: user.id });
          return formatProfileData(user, skills);
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
          return null;
        }
      }));
      
      const validProfiles = profilesWithData.filter(profile => profile !== null);
      console.log(`Successfully processed ${validProfiles.length} profiles from real data`);
      
      res.json({ profiles: validProfiles.length > 0 ? validProfiles : getBackupMockProfiles() });
    } catch (dbError) {
      console.error('Database error fetching profiles:', dbError);
      console.warn('Falling back to mock profiles due to error');
      res.json({ profiles: getBackupMockProfiles() });
    }
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching profile by ID:', id);
    
    try {
      const user = await db.findOne('User', { id });
      
      if (!user) {
        console.log('User not found, returning mock data');
        return res.json(getBackupMockProfile(id));
      }
      
      const skills = await db.findMany('Skill', { userId: id });
      const profileData = formatProfileData(user, skills);
      
      res.json(profileData);
    } catch (dbError) {
      console.error('Database error fetching profile by ID:', dbError);
      res.json(getBackupMockProfile(id));
    }
  } catch (error) {
    console.error('Error fetching profile by ID:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};