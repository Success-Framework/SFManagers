import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Role {
  id: string;
  title: string;
  isOpen: boolean;
  assignedUser?: User;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  ownerId: string;
  owner: User;
  roles: Role[];
  createdAt: string;
}

const StartupDetailPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      const token = localStorage.getItem('token');
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
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="mb-0">{startup.name}</h1>
          <p className="text-muted">{startup.stage} stage</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={() => navigate('/browse-startups')}
          >
            Back to Startups
          </button>
          
          {isOwner && (
            <button 
              className="btn btn-primary position-relative"
              onClick={() => navigate(`/startup/${startup.id}/requests`)}
            >
              Manage Requests
              {pendingRequestsCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}
          
          {!isOwner && isAuthenticated && (
            <button 
              className="btn btn-success"
              onClick={() => navigate(`/join-startup`)}
            >
              Join Startup
            </button>
          )}
        </div>
      </div>
      
      <div className="row mb-5">
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h3 className="mb-0">About</h3>
            </div>
            <div className="card-body">
              <p>{startup.details}</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h3 className="mb-0">Founder</h3>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle p-3 me-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {startup.owner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="mb-0">{startup.owner.name}</h5>
                  <p className="text-muted mb-0">Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12">
          <h3 className="mb-4">Team Members</h3>
          
          {filledRoles.length === 0 ? (
            <div className="alert alert-info">
              No team members yet other than the founder.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
              {filledRoles.map(role => (
                <div className="col" key={role.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="bg-secondary text-white rounded-circle p-3 me-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {role.assignedUser?.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h5 className="mb-0">{role.assignedUser?.name}</h5>
                          <p className="text-muted mb-0">{role.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <h3 className="mb-4">Open Positions</h3>
          
          {openRoles.length === 0 ? (
            <div className="alert alert-info">
              No open positions at the moment.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {openRoles.map(role => (
                <div className="col" key={role.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">{role.title}</h5>
                      <span className="badge bg-success mb-3">Open</span>
                      
                      {!isOwner && isAuthenticated && (
                        <div className="d-grid">
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => navigate('/join-startup')}
                          >
                            Apply for this role
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartupDetailPage; 