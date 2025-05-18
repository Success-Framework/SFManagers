import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Education, Experience } from '../../types';
import { useParams } from 'react-router-dom';
import EditProfileModal from './EditProfileModal';
import EditSkillsModal from './EditSkillsModal';
import EditEducationModal from './EditEducationModal';
import EditExperienceModal from './EditExperienceModal';

const ProfilePage: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const { id: profileId } = useParams<{ id?: string }>();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Modals state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditSkills, setShowEditSkills] = useState(false);
  const [showEditEducation, setShowEditEducation] = useState(false);
  const [showEditExperience, setShowEditExperience] = useState(false);
  const [currentEducation, setCurrentEducation] = useState<Education | null>(null);
  const [currentExperience, setCurrentExperience] = useState<Experience | null>(null);
  
  // Get profile data
  useEffect(() => {
    if (isAuthenticated && token) {
      if (profileId) {
        // Viewing another user's profile
        fetchOtherUserProfile(profileId);
        // Check if this is the user's own profile
        setIsOwnProfile(user?.id === profileId);
      } else {
        // Viewing own profile
        fetchOwnProfile();
        setIsOwnProfile(true);
      }
    }
  }, [isAuthenticated, token, profileId, user?.id]);
  
  const fetchOwnProfile = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOtherUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/profiles/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers for opening modals
  const handleEditProfile = () => setShowEditProfile(true);
  const handleEditSkills = () => setShowEditSkills(true);
  
  const handleAddEducation = () => {
    setCurrentEducation(null);
    setShowEditEducation(true);
  };
  
  const handleEditEducation = (education: Education) => {
    setCurrentEducation(education);
    setShowEditEducation(true);
  };
  
  const handleAddExperience = () => {
    setCurrentExperience(null);
    setShowEditExperience(true);
  };
  
  const handleEditExperience = (experience: Experience) => {
    setCurrentExperience(experience);
    setShowEditExperience(true);
  };
  
  // Modal success handlers
  const handleProfileSaved = () => {
    setShowEditProfile(false);
    // Refresh profile
    if (profileId) {
      fetchOtherUserProfile(profileId);
    } else {
      fetchOwnProfile();
    }
  };
  
  const handleSkillsSaved = () => {
    setShowEditSkills(false);
    // Refresh profile
    if (profileId) {
      fetchOtherUserProfile(profileId);
    } else {
      fetchOwnProfile();
    }
  };
  
  const handleEducationSaved = () => {
    setShowEditEducation(false);
    // Refresh profile
    if (profileId) {
      fetchOtherUserProfile(profileId);
    } else {
      fetchOwnProfile();
    }
  };
  
  const handleExperienceSaved = () => {
    setShowEditExperience(false);
    // Refresh profile
    if (profileId) {
      fetchOtherUserProfile(profileId);
    } else {
      fetchOwnProfile();
    }
  };
  
  // Dates formatting helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };
  
  if (loading) {
    return (
      <div className="container my-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="container my-5">
        <div className="alert alert-info" role="alert">
          {profileId ? 'Profile not found.' : 'Please log in to view your profile.'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      {/* Profile Banner */}
      {profileData.profileBanner && (
        <div className="card shadow-sm mb-4 p-0 overflow-hidden">
          <img 
            src={profileData.profileBanner} 
            alt="Profile Banner" 
            className="w-100"
            style={{ height: '200px', objectFit: 'cover' }}
          />
        </div>
      )}
      
      {/* Profile Header */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-2 text-center">
              {profileData.profileImage ? (
                <img 
                  src={profileData.profileImage} 
                  alt={profileData.name || profileData.fullName} 
                  className="rounded-circle img-fluid mb-3"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white mb-3 mx-auto"
                  style={{ width: '150px', height: '150px', fontSize: '4rem' }}
                >
                  {(profileData.name || profileData.fullName)?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              
              <div className="d-flex align-items-center justify-content-center mb-2">
                <div className="badge bg-primary me-2">
                  <i className="bi bi-star-fill me-1"></i> {profileData.points} pts
                </div>
                <div className="badge bg-accent">
                  Level {profileData.level}
                </div>
              </div>
            </div>
            
            <div className="col-md-8">
              <h1 className="display-5 fw-bold mb-1">{profileData.name || profileData.fullName}</h1>
              <p className="text-muted lead mb-2">{profileData.headline || profileData.position || 'No headline added yet'}</p>
              
              {(profileData.location) && (
                <p className="mb-2">
                  <i className="bi bi-geo-alt me-2"></i> {profileData.location}
                </p>
              )}
              
              <div className="d-flex flex-wrap gap-3 my-3">
                {(profileData.linkedinUrl || (profileData.links && profileData.links.linkedIn)) && (
                  <a href={profileData.linkedinUrl || profileData.links.linkedIn} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    <i className="bi bi-linkedin fs-4"></i>
                  </a>
                )}
                
                {(profileData.githubUrl || (profileData.links && profileData.links.github)) && (
                  <a href={profileData.githubUrl || profileData.links.github} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    <i className="bi bi-github fs-4"></i>
                  </a>
                )}
                
                {(profileData.portfolio || (profileData.links && profileData.links.portfolio)) && (
                  <span 
                    onClick={() => {
                      // Take portfolio URL, strip any protocols and www
                      let url = (profileData.portfolio || profileData.links.portfolio).trim();
                      if (!url.startsWith('http')) {
                        url = 'https://' + url;
                      }
                      // Set window.location directly to the URL
                      const newWindow = window.open();
                      if (newWindow) newWindow.location = url;
                    }}
                    className="text-decoration-none"
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-globe fs-4"></i>
                  </span>
                )}
                
                {profileData.email && (
                  <a href={`mailto:${profileData.email}`} className="text-decoration-none">
                    <i className="bi bi-envelope fs-4"></i>
                  </a>
                )}
                
                {(profileData.phone) && (
                  <a href={`tel:${profileData.phone}`} className="text-decoration-none">
                    <i className="bi bi-telephone fs-4"></i>
                  </a>
                )}
              </div>
            </div>
            
            <div className="col-md-2 text-end">
              {isOwnProfile && (
                <button 
                  className="btn btn-outline-primary" 
                  onClick={handleEditProfile}
                >
                  <i className="bi bi-pencil-square me-2"></i> Edit Profile
                </button>
              )}
              {!isOwnProfile && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => window.location.href = `/messages/new?recipient=${profileId}`}
                >
                  <i className="bi bi-chat-dots me-2"></i> Message
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* About Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h3 className="mb-0">About</h3>
          {isOwnProfile && (
            <button className="btn btn-sm btn-outline-primary" onClick={handleEditProfile}>
              <i className="bi bi-pencil-square"></i>
            </button>
          )}
        </div>
        <div className="card-body">
          <p className="card-text">{profileData.bio || 'No bio added yet.'}</p>
        </div>
      </div>
      
      {/* Skills Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h3 className="mb-0">Skills</h3>
          {isOwnProfile && (
            <button className="btn btn-sm btn-outline-primary" onClick={handleEditSkills}>
              <i className="bi bi-pencil-square"></i>
            </button>
          )}
        </div>
        <div className="card-body">
          {profileData.skills && profileData.skills.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {profileData.skills.map((skill: any) => (
                <span key={skill.id} className="badge bg-light text-dark p-2 fs-6">
                  {skill.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted">No skills added yet. Add some skills to showcase your expertise!</p>
          )}
        </div>
      </div>
      
      {/* Experience Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h3 className="mb-0">Experience</h3>
          <button className="btn btn-sm btn-outline-primary" onClick={handleAddExperience}>
            <i className="bi bi-plus-lg"></i> Add
          </button>
        </div>
        <div className="card-body">
          {profileData.experience && profileData.experience.length > 0 ? (
            <div className="timeline">
              {profileData.experience.map((exp: Experience) => (
                <div key={exp.id} className="timeline-item mb-4 position-relative">
                  <div className="d-flex">
                    <div className="timeline-icon bg-primary rounded">
                      <i className="bi bi-briefcase text-white"></i>
                    </div>
                    <div className="timeline-content ms-3">
                      <div className="d-flex justify-content-between">
                        <h4 className="mb-1">{exp.title}</h4>
                        <button 
                          className="btn btn-sm btn-link text-primary" 
                          onClick={() => handleEditExperience(exp)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </div>
                      <h5 className="text-muted mb-1">{exp.company}</h5>
                      <p className="text-muted mb-1">
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                        {exp.location && ` · ${exp.location}`}
                      </p>
                      {exp.description && <p className="mb-0">{exp.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No experience added yet. Add your work history!</p>
          )}
        </div>
      </div>
      
      {/* Education Section */}
      <div className="card shadow-sm mb-4">
        <div className="card-header d-flex justify-content-between align-items-center bg-white">
          <h3 className="mb-0">Education</h3>
          <button className="btn btn-sm btn-outline-primary" onClick={handleAddEducation}>
            <i className="bi bi-plus-lg"></i> Add
          </button>
        </div>
        <div className="card-body">
          {profileData.education && profileData.education.length > 0 ? (
            <div className="timeline">
              {profileData.education.map((edu: Education) => (
                <div key={edu.id} className="timeline-item mb-4 position-relative">
                  <div className="d-flex">
                    <div className="timeline-icon bg-primary rounded">
                      <i className="bi bi-mortarboard text-white"></i>
                    </div>
                    <div className="timeline-content ms-3">
                      <div className="d-flex justify-content-between">
                        <h4 className="mb-1">{edu.school}</h4>
                        <button 
                          className="btn btn-sm btn-link text-primary" 
                          onClick={() => handleEditEducation(edu)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </div>
                      <h5 className="text-muted mb-1">{edu.degree}, {edu.fieldOfStudy}</h5>
                      <p className="text-muted mb-1">
                        {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                      </p>
                      {edu.description && <p className="mb-0">{edu.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No education added yet. Add your educational background!</p>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <EditProfileModal 
        show={showEditProfile} 
        onHide={() => setShowEditProfile(false)} 
        profileData={profileData}
        onProfileUpdated={handleProfileSaved}
      />
      
      <EditSkillsModal 
        show={showEditSkills} 
        onHide={() => setShowEditSkills(false)} 
        skills={profileData.skills || []}
        onSkillsUpdated={handleSkillsSaved}
      />
      
      <EditEducationModal
        show={showEditEducation}
        onHide={() => setShowEditEducation(false)}
        education={currentEducation}
        onEducationUpdated={handleEducationSaved}
      />
      
      <EditExperienceModal
        show={showEditExperience}
        onHide={() => setShowEditExperience(false)}
        experience={currentExperience}
        onExperienceUpdated={handleExperienceSaved}
      />
    </div>
  );
};

export default ProfilePage; 