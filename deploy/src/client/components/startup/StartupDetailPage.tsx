import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EditStartupModal from './EditStartupModal';
import ManageRolesModal from './ManageRolesModal';
import ManageUserRolesModal from './ManageUserRolesModal';
import AffiliateLink from '../affiliate/AffiliateLink';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Role {
  id: string;
  title: string;
  roleType: string;
  isOpen: boolean;
  isPaid: boolean;
  assignedUser?: User;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  logo?: string;
  website?: string;
  location?: string;
  industry?: string;
  ownerId: string;
  owner: User;
  roles: Role[];
  createdAt: string;
  banner?: string;
}

const StartupDetailPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showManageRolesModal, setShowManageRolesModal] = useState<boolean>(false);
  const [showManageUserRolesModal, setShowManageUserRolesModal] = useState<boolean>(false);

  useEffect(() => {
    if (!startupId) {
      setError('No startup ID provided');
      setLoading(false);
      return;
    }

    fetchStartupDetails();
    
    // If the user is the owner, fetch pending requests count
    if (isAuthenticated && startup?.ownerId === user?.id) {
      fetchPendingRequestsCount();
    }
  }, [startupId, isAuthenticated, user?.id]);

  const fetchStartupDetails = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/startups/${startupId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch startup details');
      }
      
      const data = await response.json();
      setStartup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequestsCount = async () => {
    if (!isAuthenticated || !startupId) return;
    
    try {
      const response = await fetch(`/api/join-requests/startup/${startupId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch join requests');
      }
      
      const data = await response.json();
      const pendingRequests = data.filter((req: any) => req.status === 'PENDING');
      setPendingRequestsCount(pendingRequests.length);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      // Don't set error state here as it's not critical for the main functionality
    }
  };

  const handleStartupUpdate = (updatedStartup: Startup) => {
    setStartup(updatedStartup);
    setShowEditModal(false);
  };

  const handleRolesUpdate = () => {
    fetchStartupDetails();
    setShowManageRolesModal(false);
  };

  const handleUserRolesUpdate = () => {
    fetchStartupDetails();
    setShowManageUserRolesModal(false);
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error || 'Startup not found'}</div>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/browse-startups')}
        >
          Browse Startups
        </button>
      </div>
    );
  }

  const isOwner = isAuthenticated && user?.id === startup.ownerId;
  const filledRoles = startup.roles.filter(role => !role.isOpen);
  const openRoles = startup.roles.filter(role => role.isOpen);

  return (
    <div className="container-fluid py-4 px-lg-5">
      <div className="row">
        <div className="col-lg-10 mx-auto">
          {/* Banner Section */}
          {startup.banner && (
            <div className="startup-banner-container mb-4 neon-border">
              <img 
                src={startup.banner.startsWith('/uploads') ? startup.banner : `/uploads/${startup.banner.split('/').pop()}`} 
                alt={`${startup.name} banner`} 
                className="startup-banner-image" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error("Banner load error:", startup.banner);
                  target.onerror = null; // Prevent infinite loop
                  target.src = 'https://via.placeholder.com/1200x300?text=Banner+Not+Available';
                }}
              />
              <div className="startup-banner-overlay">
                <div className="d-flex align-items-center">
                  {startup.logo ? (
                    <img 
                      src={startup.logo.startsWith('/uploads') ? startup.logo : `/uploads/${startup.logo.split('/').pop()}`} 
                      alt={`${startup.name} logo`} 
                      className="startup-detail-logo me-3" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://via.placeholder.com/100?text=Logo';
                      }}
                    />
                  ) : (
                    <div className="startup-detail-logo me-3 d-flex align-items-center justify-content-center">
                      {startup.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="fw-bold mb-0 text-white">{startup.name}</h1>
                    <div className="d-flex flex-wrap align-items-center mt-2">
                      <span className="stage-badge me-3">{startup.stage}</span>
                      {startup.industry && (
                        <span className="me-3 text-white opacity-75">
                          <i className="bi bi-briefcase me-1"></i>
                          {startup.industry}
                        </span>
                      )}
                      {startup.location && (
                        <span className="text-white opacity-75">
                          <i className="bi bi-geo-alt me-1"></i>
                          {startup.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header Section (for startups without banner) */}
          {!startup.banner && (
            <div className="startup-detail-header mb-4">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start">
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  {startup.logo ? (
                    <img 
                      src={startup.logo.startsWith('/uploads') ? startup.logo : `/uploads/${startup.logo.split('/').pop()}`} 
                      alt={`${startup.name} logo`} 
                      className="startup-detail-logo me-3" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://via.placeholder.com/100?text=Logo';
                      }}
                    />
                  ) : (
                    <div className="startup-detail-logo me-3 d-flex align-items-center justify-content-center">
                      {startup.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="fw-bold mb-0">{startup.name}</h1>
                    <div className="d-flex flex-wrap align-items-center mt-2">
                      <span className="stage-badge me-3">{startup.stage}</span>
                      {startup.industry && (
                        <span className="me-3 text-white opacity-75">
                          <i className="bi bi-briefcase me-1"></i>
                          {startup.industry}
                        </span>
                      )}
                      {startup.location && (
                        <span className="text-white opacity-75">
                          <i className="bi bi-geo-alt me-1"></i>
                          {startup.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions Bar */}
          <div className="action-buttons-container mb-4">
            <button 
              className="btn btn-outline-primary btn-with-icon"
              onClick={() => navigate('/browse-startups')}
            >
              <i className="bi bi-arrow-left"></i>
              <span>Back</span>
            </button>
            
            {isOwner && (
              <>
                <button 
                  className="btn btn-primary btn-with-icon position-relative"
                  onClick={() => navigate(`/startup/${startup.id}/requests`)}
                >
                  <i className="bi bi-people"></i>
                  <span>Requests</span>
                  {pendingRequestsCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
                <button 
                  className="btn btn-accent btn-with-icon"
                  onClick={() => setShowEditModal(true)}
                >
                  <i className="bi bi-pencil"></i>
                  <span>Edit</span>
                </button>
                <button 
                  className="btn btn-secondary btn-with-icon"
                  onClick={() => setShowManageRolesModal(true)}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Roles</span>
                </button>
                <button 
                  className="btn btn-info btn-with-icon"
                  onClick={() => setShowManageUserRolesModal(true)}
                >
                  <i className="bi bi-people-fill"></i>
                  <span>Manage Team</span>
                </button>
              </>
            )}
          </div>
          
          {/* About Section */}
          <div className="card shadow-sm mb-4 border-0 with-hover-effect">
            <div className="card-header border-bottom-0 pt-4">
              <h3 className="mb-0 fw-bold">About</h3>
            </div>
            <div className="card-body pt-0">
              <p className="mb-4">{startup.details}</p>
              
              <div className="row mt-4">
                {startup.website && (
                  <div className="col-md-6 mb-3">
                    <h5 className="fw-bold">Website</h5>
                    <a href={startup.website} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center website-link">
                      <i className="bi bi-globe me-2"></i>
                      {startup.website}
                      <i className="bi bi-arrow-up-right ms-2 external-link-icon"></i>
                    </a>
                  </div>
                )}
                <div className="col-md-6 mb-3">
                  <h5 className="fw-bold">Founded</h5>
                  <p className="mb-0 d-flex align-items-center">
                    <i className="bi bi-calendar-event me-2"></i>
                    {new Date(startup.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Affiliate Link Section */}
          <AffiliateLink startupId={startup.id} startupName={startup.name} />
          
          {/* Founder Section */}
          <div className="card shadow-sm mb-4 border-0 with-hover-effect">
            <div className="card-header border-bottom-0 pt-4">
              <h3 className="mb-0 fw-bold">Founder</h3>
            </div>
            <div className="card-body pt-0">
              <div className="d-flex align-items-center">
                <div className="founder-avatar me-3">
                  {startup.owner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="fw-bold mb-0">{startup.owner.name}</h5>
                  <p className="text-muted mb-1">{startup.owner.email}</p>
                  <span className="badge founder-badge">Founder</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Team Members Section */}
          <div className="card shadow-sm mb-4 border-0 with-hover-effect">
            <div className="card-header border-bottom-0 pt-4">
              <h3 className="mb-0 fw-bold">Team Members</h3>
            </div>
            <div className="card-body pt-0">
              {filledRoles.length === 0 ? (
                <div className="alert alert-info">
                  No team members yet other than the founder.
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {filledRoles.map(role => (
                    <div className="col" key={role.id}>
                      <div className="team-member-card">
                        <div className="team-member-avatar">
                          {role.assignedUser?.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="team-member-info">
                          <h5 className="mb-0 fw-bold">{role.assignedUser?.name}</h5>
                          <p className="mb-1">{role.title}</p>
                          <span className="badge role-type-badge">{role.roleType}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Open Positions Section */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-white border-bottom-0 pt-4">
              <h3 className="mb-0 fw-bold">Open Positions</h3>
            </div>
            <div className="card-body pt-0">
              {openRoles.length === 0 ? (
                <div className="alert alert-info">
                  No open positions at the moment.
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {openRoles.map(role => (
                    <div className="col" key={role.id}>
                      <div className="card h-100 shadow-sm border-0">
                        <div className="card-body">
                          <h5 className="card-title fw-bold">{role.title}</h5>
                          <div className="d-flex mb-3 gap-2">
                            <span className="badge bg-success">Open Position</span>
                            {role.isPaid ? (
                              <span className="badge bg-info">Paid Position</span>
                            ) : (
                              <span className="badge bg-secondary">Volunteer</span>
                            )}
                          </div>
                          <p className="mb-2"><small className="text-muted">{role.roleType}</small></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Startup Modal */}
      {showEditModal && startup && (
        <EditStartupModal 
          startup={startup}
          onSave={(updatedStartup) => handleStartupUpdate(updatedStartup)}
          onCancel={() => setShowEditModal(false)}
        />
      )}
      
      {/* Manage Roles Modal */}
      {showManageRolesModal && startup && (
        <ManageRolesModal
          startup={startup}
          onSave={handleRolesUpdate}
          onCancel={() => setShowManageRolesModal(false)}
        />
      )}

      {/* Manage User Roles Modal */}
      {showManageUserRolesModal && startup && startupId && (
        <ManageUserRolesModal
          startupId={startupId}
          onSuccess={handleUserRolesUpdate}
          onClose={() => setShowManageUserRolesModal(false)}
        />
      )}
    </div>
  );
};

export default StartupDetailPage; 