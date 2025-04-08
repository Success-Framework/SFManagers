import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Role {
  id: string;
  title: string;
  isOpen: boolean;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  location?: string;
  industry?: string;
  roles: Role[];
  ownerId: string;
  createdAt: string;
}

const BrowseStartupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [startups, setStartups] = useState<Startup[]>([]);
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchStartups();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [startups, filter, searchTerm]);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/startups');
      
      if (!response.ok) {
        throw new Error('Failed to fetch startups');
      }
      
      const data = await response.json();
      setStartups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...startups];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        startup => 
          startup.name.toLowerCase().includes(term) || 
          startup.details.toLowerCase().includes(term) ||
          startup.stage.toLowerCase().includes(term) ||
          (startup.location?.toLowerCase() || '').includes(term) ||
          (startup.industry?.toLowerCase() || '').includes(term) ||
          startup.roles.some(role => role.title.toLowerCase().includes(term))
      );
    }
    
    // Apply type filter
    if (filter === 'my-startups' && isAuthenticated && user) {
      result = result.filter(startup => startup.ownerId === user.id);
    } else if (filter === 'open-roles') {
      result = result.filter(startup => 
        startup.roles.some(role => role.isOpen)
      );
    }
    
    setFilteredStartups(result);
  };

  const getOpenRolesCount = (startup: Startup) => {
    return startup.roles.filter(role => role.isOpen).length;
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

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Browse Startups</h1>
        
        {isAuthenticated && (
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/create-startup')}
          >
            Create Startup
          </button>
        )}
      </div>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, details, location, industry, stage, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="btn-group float-end" role="group">
            <button
              type="button"
              className={`btn btn-outline-primary ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {isAuthenticated && (
              <button
                type="button"
                className={`btn btn-outline-primary ${filter === 'my-startups' ? 'active' : ''}`}
                onClick={() => setFilter('my-startups')}
              >
                My Startups
              </button>
            )}
            <button
              type="button"
              className={`btn btn-outline-primary ${filter === 'open-roles' ? 'active' : ''}`}
              onClick={() => setFilter('open-roles')}
            >
              Open Roles
            </button>
          </div>
        </div>
      </div>
      
      {filteredStartups.length === 0 ? (
        <div className="alert alert-info">
          {filter === 'my-startups' 
            ? "You don't have any startups yet. Create one!" 
            : filter === 'open-roles' && searchTerm 
              ? "No startups found with open roles matching your search." 
              : filter === 'open-roles' 
                ? "No startups with open roles found." 
                : searchTerm 
                  ? "No startups found matching your search."
                  : "No startups found."}
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredStartups.map(startup => {
            const openRolesCount = getOpenRolesCount(startup);
            const isOwner = isAuthenticated && user?.id === startup.ownerId;
            
            return (
              <div className="col" key={startup.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">{startup.name}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">{startup.stage} stage</h6>
                    
                    {(startup.location || startup.industry) && (
                      <div className="mb-2">
                        {startup.industry && (
                          <span className="badge bg-secondary me-2">{startup.industry}</span>
                        )}
                        {startup.location && (
                          <span className="badge bg-light text-dark border">
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            {startup.location}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="card-text">
                      {startup.details.length > 120 
                        ? `${startup.details.substring(0, 120)}...` 
                        : startup.details}
                    </p>
                    
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="badge bg-info">
                        {openRolesCount} open role{openRolesCount !== 1 ? 's' : ''}
                      </span>
                      
                      {isOwner && (
                        <span className="badge bg-success">You own this</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-footer bg-transparent">
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-outline-primary" 
                        onClick={() => navigate(`/startup/${startup.id}`)}
                      >
                        View Details
                      </button>
                      
                      {!isOwner && isAuthenticated && openRolesCount > 0 && (
                        <button 
                          className="btn btn-success" 
                          onClick={() => navigate('/join-startup')}
                        >
                          Join Startup
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseStartupsPage; 