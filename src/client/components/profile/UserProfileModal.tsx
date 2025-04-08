import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

interface UserProfileModalProps {
  show: boolean;
  onHide: () => void;
  userId: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ show, onHide, userId }) => {
  const { token } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && userId) {
      fetchUserProfile();
    }
  }, [show, userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/profile/${userId}`, {
        headers: {
          'x-auth-token': token || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  // Helper for formatting dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>User Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : profileData ? (
          <div className="profile-container">
            {/* Profile Header */}
            <div className="d-flex align-items-center mb-4">
              {profileData.profileImage ? (
                <img
                  src={profileData.profileImage}
                  alt={profileData.name}
                  className="rounded-circle me-3"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white me-3"
                  style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}
                >
                  {profileData.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h2 className="mb-1">{profileData.name}</h2>
                <p className="text-muted mb-1">{profileData.headline || 'No headline'}</p>
                {profileData.location && (
                  <p className="mb-1">
                    <i className="bi bi-geo-alt me-2"></i> {profileData.location}
                  </p>
                )}
                <div className="d-flex align-items-center mt-2">
                  <div className="badge bg-primary me-2">
                    <i className="bi bi-star-fill me-1"></i> {profileData.points} pts
                  </div>
                  <div className="badge bg-accent">
                    Level {profileData.level}
                  </div>
                </div>
              </div>
              <div className="ms-auto">
                {profileData.linkedinUrl && (
                  <a href={profileData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm me-2">
                    <i className="bi bi-linkedin me-1"></i> LinkedIn
                  </a>
                )}
                {profileData.githubUrl && (
                  <a href={profileData.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                    <i className="bi bi-github me-1"></i> GitHub
                  </a>
                )}
              </div>
            </div>

            {/* About Section */}
            <div className="mb-4">
              <h4 className="mb-3">About</h4>
              <p>{profileData.bio || 'No bio provided.'}</p>
            </div>

            {/* Skills Section */}
            {profileData.skills && profileData.skills.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-3">Skills</h4>
                <div className="d-flex flex-wrap gap-2">
                  {profileData.skills.map((skill: any) => (
                    <span key={skill.id} className="badge bg-light text-dark p-2 fs-6">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {profileData.experience && profileData.experience.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-3">Experience</h4>
                {profileData.experience.map((exp: any) => (
                  <div key={exp.id} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{exp.title}</h5>
                      <h6 className="card-subtitle mb-2 text-muted">{exp.company}</h6>
                      <p className="card-text text-muted mb-2">
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                        {exp.location && ` · ${exp.location}`}
                      </p>
                      {exp.description && <p className="card-text">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Education Section */}
            {profileData.education && profileData.education.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-3">Education</h4>
                {profileData.education.map((edu: any) => (
                  <div key={edu.id} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{edu.school}</h5>
                      <h6 className="card-subtitle mb-2 text-muted">{edu.degree}, {edu.fieldOfStudy}</h6>
                      <p className="card-text text-muted mb-2">
                        {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                      </p>
                      {edu.description && <p className="card-text">{edu.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Current Startups Section */}
            {profileData.joinedRoles && profileData.joinedRoles.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-3">Current Startups</h4>
                <div className="row">
                  {profileData.joinedRoles.map((userRole: any) => (
                    <div key={userRole.id} className="col-md-6 mb-3">
                      <div className="card h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-2">
                            {userRole.role?.startup?.logo ? (
                              <img
                                src={userRole.role.startup.logo}
                                alt={userRole.role.startup.name}
                                className="me-2 rounded"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="d-flex align-items-center justify-content-center bg-secondary text-white rounded me-2"
                                style={{ width: '40px', height: '40px' }}
                              >
                                {userRole.role?.startup?.name?.charAt(0).toUpperCase() || 'S'}
                              </div>
                            )}
                            <div>
                              <h5 className="card-title mb-0">{userRole.role?.startup?.name}</h5>
                              <p className="card-text text-muted mb-0">{userRole.role?.title}</p>
                            </div>
                          </div>
                          <p className="card-text text-muted">
                            <small>Joined {new Date(userRole.joinedAt).toLocaleDateString()}</small>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Link */}
            {profileData.portfolio && (
              <div className="text-center mt-4">
                <a
                  href={profileData.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary"
                >
                  <i className="bi bi-globe me-2"></i> Visit Portfolio
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="alert alert-info" role="alert">
            No user profile data available
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserProfileModal; 