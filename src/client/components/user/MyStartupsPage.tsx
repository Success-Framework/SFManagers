import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface Role {
  id: string;
  title: string;
  isOpen: boolean;
}

interface UserRole {
  id: string;
  role: Role;
  status: string;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  ownerId: string;
  createdAt: string;
  roles?: Role[];
}

const MyStartupsPage: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const [ownedStartups, setOwnedStartups] = useState<Startup[]>([]);
  const [joinedStartups, setJoinedStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch owned startups
        const ownedResponse = await axios.get('/api/startups/my-startups', {
          headers: { 'x-auth-token': token }
        });
        setOwnedStartups(ownedResponse.data);
        
        // Fetch joined startups
        const joinedResponse = await axios.get('/api/auth/joined-startups', {
          headers: { 'x-auth-token': token }
        });
        setJoinedStartups(joinedResponse.data);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching startups:', err);
        setError(err.response?.data?.msg || 'Failed to fetch startups');
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const handleViewDetails = (startupId: string) => {
    navigate(`/startup/${startupId}`);
  };

  const handleViewDashboard = (startup: Startup) => {
    // Convert startup name to URL-friendly format (kebab case)
    const startupSlug = startup.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    navigate(`/startup/${startup.id}/dashboard`);
  };

  const handleManageRequests = (startupId: string) => {
    navigate(`/startup/${startupId}/requests`);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">My Startups</h1>
      
      {/* Owned Startups */}
      <div className="mb-5">
        <h2 className="h4 mb-3">Startups I Own</h2>
        {ownedStartups.length === 0 ? (
          <div className="alert alert-info">
            You don't own any startups yet. <a href="/create-startup">Create a startup</a> to get started.
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {ownedStartups.map(startup => (
              <div key={startup.id} className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{startup.name}</h5>
                    <p className="card-text">
                      {startup.details.length > 100 
                        ? `${startup.details.substring(0, 100)}...` 
                        : startup.details}
                    </p>
                    <p className="badge bg-info">{startup.stage}</p>
                  </div>
                  <div className="card-footer">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => handleViewDetails(startup.id)}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn btn-outline-success btn-sm" 
                        onClick={() => handleViewDashboard(startup)}
                      >
                        View Dashboard
                      </button>
                      <button 
                        className="btn btn-outline-secondary btn-sm" 
                        onClick={() => handleManageRequests(startup.id)}
                      >
                        Requests
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Joined Startups */}
      <div>
        <h2 className="h4 mb-3">Startups I've Joined</h2>
        {joinedStartups.length === 0 ? (
          <div className="alert alert-info">
            You haven't joined any startups yet. <a href="/join-startup">Join a startup</a> to collaborate with others.
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {joinedStartups.map(startup => (
              <div key={startup.id} className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{startup.name}</h5>
                    <p className="card-text">
                      {startup.details.length > 100 
                        ? `${startup.details.substring(0, 100)}...` 
                        : startup.details}
                    </p>
                    <p className="badge bg-info">{startup.stage}</p>
                    {startup.roles && startup.roles.length > 0 && (
                      <p className="mt-2">
                        <small className="text-muted">
                          Role: {startup.roles[0].title}
                        </small>
                      </p>
                    )}
                  </div>
                  <div className="card-footer">
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => handleViewDetails(startup.id)}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn btn-outline-success btn-sm" 
                        onClick={() => handleViewDashboard(startup)}
                      >
                        View Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStartupsPage; 