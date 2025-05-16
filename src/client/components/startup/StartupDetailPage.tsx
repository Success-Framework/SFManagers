import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EditStartupModal from './EditStartupModal';
import ManageRolesModal from './ManageRolesModal';
import ManageUserRolesModal from './ManageUserRolesModal';
import { UserRole } from '../../types';

// Define user role types
type UserRoleType = 'owner' | 'admin' | 'manager' | 'employee' | 'none';

interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  industry: string;
  location: string;
  website?: string;
  logo?: string;
  banner?: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  roles: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    skills: string;
    isOpen: boolean;
    assignedUserId?: string;
    isPaid?: boolean;
    role?: string;
    roleType?: string;
  }>;
  members: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  createdAt: string;
}

const StartupDetailPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [userRole, setUserRole] = useState<UserRoleType>('none');
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Helper function to normalize image paths
  const normalizeImagePath = (path: string | null | undefined): string => {
    if (!path) return '';
    
    console.log('Normalizing image path:', path);
    
    // If the path already starts with http or https, leave it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If path starts with /uploads, it's a relative path
    if (path.startsWith('/uploads/')) {
      return path;
    }
    
    // If path starts with uploads/ (without leading slash), add the slash
    if (path.startsWith('uploads/')) {
      return `/${path}`;
    }
    
    // Otherwise, assume it's just a filename and prepend /uploads/
    return `/uploads/${path}`;
  };

  // Use this to force a refresh
  const refreshData = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Determine user's role in this startup
  const determineUserRole = (startup: Startup): UserRoleType => {
    if (!isAuthenticated || !user) return 'none';
    
    // Check if user is the owner
    if (startup.ownerId === user.id) return 'owner';
    
    // Check assigned roles
    if (!startup.roles) return 'none';
    
    const userRole = startup.roles.find(role => 
      role.assignedUserId === user.id && !role.isOpen && !role.isPaid
    );
    
    if (!userRole) return 'none';
    
    // Determine role type
    const roleType = (userRole.role || userRole.roleType || '').toLowerCase();
    if (roleType.includes('admin')) return 'admin';
    if (roleType.includes('manager')) return 'manager';
    return 'employee';
  };

  useEffect(() => {
    if (!startupId) {
      setError('No startup ID provided');
      setLoading(false);
      return;
    }

    // Clear any previous data and error
    setStartup(null);
    setError(null);
    setLoading(true);

    fetchStartupDetails();
    
    // If the user is the owner, fetch pending requests count
    if (isAuthenticated && startup?.ownerId === user?.id) {
      fetchPendingRequestsCount();
    }
  }, [startupId, isAuthenticated, refreshKey]);

  // Update user role when startup data changes
  useEffect(() => {
    if (startup) {
      const role = determineUserRole(startup);
      setUserRole(role);
    }
  }, [startup, user?.id, isAuthenticated]);

  const fetchStartupDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching startup details for ID:', startupId);
      
      const response = await fetch(`/api/startups/${startupId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        throw new Error(`Failed to fetch startup details: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Startup data retrieved:', data);
      
      // Reset image errors when new data is loaded
      setBannerError(false);
      setLogoError(false);
      
      // Log image paths for debugging
      console.log('Image paths:', {
        logo: data.logo ? normalizeImagePath(data.logo) : 'No logo',
        banner: data.banner ? normalizeImagePath(data.banner) : 'No banner'
      });
      
      setStartup(data);
    } catch (err) {
      console.error('Error in fetchStartupDetails:', err);
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
    // Clear any image errors when the startup is updated
    setBannerError(false);
    setLogoError(false);
    
    // Update the startup data with the new values
    setStartup(prev => prev ? { ...prev, ...updatedStartup } : null);
    
    // Force refresh of startup data to ensure we have the latest
    setTimeout(() => fetchStartupDetails(), 500);
  };

  const handleRolesUpdate = () => {
    fetchStartupDetails();
  };

  const handleUserRolesUpdate = () => {
    fetchStartupDetails();
  };

  const handleRoleSelect = (roleId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/startup/${startupId}` } });
      return;
    }
    navigate(`/startup/${startupId}/join-request/${roleId}`);
  };

  // Helper function to check if user has admin privileges
  const hasAdminPrivileges = (): boolean => {
    return ['owner', 'admin', 'manager'].includes(userRole);
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
  const filledRoles = startup.roles ? startup.roles.filter(role => !role.isOpen) : [];
  const openRoles = startup.roles ? startup.roles.filter(role => role.isOpen) : [];

  return (
    <div className="startup-detail-page">
      {/* Hero Section with Banner */}
      <div className="position-relative">
        {/* Banner Image */}
        {startup.banner && (
          <div className="banner-container position-relative" style={{ height: '300px', overflow: 'hidden' }}>
            <img
              src={normalizeImagePath(startup.banner)}
              alt={`${startup.name} banner`}
              className="banner-image w-100 h-100 object-fit-cover"
              onError={(e) => {
                console.error('Error loading banner image:', e);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"></div>
          </div>
        )}
        
        {/* Overlay with Logo and Basic Info */}
        <div className="position-absolute" style={{ bottom: '-100px', left: '20px', right: '20px', zIndex: 1 }}>
          <div className="d-flex align-items-end">
            {/* Logo Image */}
            <div className="logo-container bg-white rounded-3 p-2 shadow" style={{ width: '150px', height: '150px' }}>
              {startup.logo ? (
                <img
                  src={normalizeImagePath(startup.logo)}
                  alt={`${startup.name} logo`}
                  className="logo-image w-100 h-100 object-fit-contain"
                  onError={(e) => {
                    console.error('Error loading logo image:', e);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="logo-placeholder w-100 h-100 d-flex align-items-center justify-content-center bg-light rounded-3">
                  <i className="bi bi-building fs-1 text-muted"></i>
                </div>
              )}
            </div>
            <div className="ms-4 text-white">
              <h1 className="mb-1 fw-bold text-white">{startup?.name}</h1>
              <p className="mb-0 fs-5">
                <span className="badge bg-primary me-2">{startup?.industry}</span>
                <span className="badge bg-secondary">{startup?.location}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mt-5 pt-5">
        <div className="row">
          {/* Left Column - Main Content */}
          <div className="col-lg-8">
            {/* About Section */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-body">
                <h2 className="h4 mb-3 fw-bold text-dark">About</h2>
                <p className="card-text fs-5 text-dark">{startup?.details}</p>
                {startup?.website && (
                  <a href={startup.website} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary mt-3">
                    <i className="bi bi-globe me-1"></i> Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Team Members Section */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h2 className="h4 mb-0 fw-bold text-dark">Team Members</h2>
                {userRole === 'owner' && (
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => navigate(`/startup/${startupId}/members`)}
                  >
                    <i className="bi bi-people me-1"></i> Manage Members
                  </button>
                )}
              </div>
              <div className="card-body">
                <div className="row row-cols-1 row-cols-md-2 g-4">
                  {startup?.members?.map((member: any) => (
                    <div key={member.id} className="col">
                      <div className="d-flex align-items-center p-3 bg-light rounded-3">
                        <div className="avatar bg-primary text-white rounded-circle p-3 me-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold text-dark">{member.name}</h6>
                          <small className="text-muted">{member.role}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Open Roles Section */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h2 className="h4 mb-0 fw-bold text-dark">Open Roles</h2>
              </div>
              <div className="card-body">
                <div className="row row-cols-1 row-cols-md-2 g-4">
                  {openRoles.map((role) => (
                    <div key={role.id} className="col">
                      <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                          <h5 className="card-title fw-bold text-dark">{role.title}</h5>
                          <p className="card-text text-muted">{role.description}</p>
                          <div className="d-flex gap-2 mb-3">
                            <span className="badge bg-info">{role.roleType}</span>
                            {role.isPaid && <span className="badge bg-success">Paid</span>}
                          </div>
                          <button
                            className="btn btn-primary w-100"
                            onClick={() => handleRoleSelect(role.id)}
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="col-lg-4">
            {/* Startup Info Card */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0 fw-bold text-dark">Startup Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <h6 className="text-muted">Stage</h6>
                  <p className="fw-bold text-dark">{startup?.stage}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Industry</h6>
                  <p className="fw-bold text-dark">{startup?.industry}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Location</h6>
                  <p className="fw-bold text-dark">{startup?.location}</p>
                </div>
                <div className="mb-3">
                  <h6 className="text-muted">Founded</h6>
                  <p className="fw-bold text-dark">{new Date(startup?.createdAt || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Owner Info Card */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h2 className="h4 mb-0 fw-bold text-dark">Founder</h2>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar bg-primary text-white rounded-circle p-3 me-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {startup?.owner?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">{startup?.owner?.name}</h6>
                    <small className="text-muted">{startup?.owner?.email}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            {userRole === 'owner' && (
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0">
                  <h2 className="h4 mb-0 fw-bold text-dark">Admin Actions</h2>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate(`/startup/${startupId}/edit`)}
                    >
                      <i className="bi bi-pencil me-1"></i> Edit Startup
                    </button>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => navigate(`/startup/${startupId}/members`)}
                    >
                      <i className="bi bi-people me-1"></i> Manage Members
                    </button>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => navigate(`/startup/${startupId}/roles`)}
                    >
                      <i className="bi bi-person-gear me-1"></i> Manage Roles
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupDetailPage; 