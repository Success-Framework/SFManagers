import React, { useState, useEffect } from 'react';
import { Startup, Role, JoinRequestFormData, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import StartupCard from './StartupCard';
import StartupDetail from './StartupDetail';
import axios from 'axios';

interface StartupDetailType extends Startup {
  owner?: {
    id: string;
    name: string;
    email: string;
    points: number;
    level: number;
    createdAt: string;
    updatedAt: string;
  };
}

const JoinStartupPage: React.FC = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<StartupDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userStartupIds, setUserStartupIds] = useState<Set<string>>(new Set());
  const [industryFilter, setIndustryFilter] = useState<string>('');
  
  const { isAuthenticated, user, token } = useAuth();
  
  useEffect(() => {
    fetchUserStartups();
    fetchStartups();
  }, [isAuthenticated, token]);
  
  const fetchUserStartups = async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      // Fetch owned startups
      const ownedResponse = await axios.get('/api/startups/my-startups', {
        headers: { 'x-auth-token': token }
      });
      
      // Fetch joined startups
      const joinedResponse = await axios.get('/api/auth/joined-startups', {
        headers: { 'x-auth-token': token }
      });
      
      // Combine startup IDs from both sources
      const ownedIds = ownedResponse.data.map((s: Startup) => s.id);
      const joinedIds = joinedResponse.data.map((s: Startup) => s.id);
      const allUserStartupIds = new Set([...ownedIds, ...joinedIds]);
      
      setUserStartupIds(allUserStartupIds);
    } catch (err) {
      console.error('Error fetching user startups:', err);
    }
  };
  
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
      console.error('Error fetching startups:', err);
      setError('Failed to load startups. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectStartup = (startup: Startup) => {
    // Make sure we have the required owner object structure for StartupDetail
    if (startup.owner) {
      const detailStartup: StartupDetailType = {
        ...startup,
        owner: {
          id: startup.owner.id,
          name: startup.owner.name || 'Unknown',
          email: startup.owner.email,
          points: startup.owner.points || 0,
          level: startup.owner.level || 1,
          createdAt: startup.owner.createdAt || new Date().toISOString(),
          updatedAt: startup.owner.updatedAt || new Date().toISOString()
        }
      };
      setSelectedStartup(detailStartup);
    } else {
      // Fetch full startup details including owner
      fetchStartupDetails(startup.id);
    }
    setRequestSuccess(false);
    setRequestError(null);
    setSelectedRoleId(null);
    setMessage('');
  };
  
  const fetchStartupDetails = async (startupId: string) => {
    try {
      const response = await fetch(`/api/startups/${startupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch startup details');
      }
      
      const data = await response.json();
      setSelectedStartup(data);
    } catch (err) {
      console.error('Error fetching startup details:', err);
      setError('Failed to load startup details. Please try again later.');
    }
  };
  
  const handleBackToList = () => {
    setSelectedStartup(null);
    setSelectedRoleId(null);
    setMessage('');
  };
  
  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    setRequestSuccess(false);
    setRequestError(null);
  };
  
  const handleSubmitJoinRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoleId) {
      setRequestError('Please select a role first');
      return;
    }
    
    handleJoinRequest({ 
      roleId: selectedRoleId, 
      message 
    });
  };
  
  const handleJoinRequest = async (formData: JoinRequestFormData) => {
    if (!isAuthenticated) {
      setRequestError('You must be logged in to send a join request');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await axios.post('/api/join-requests', formData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        }
      });
      
      // Request successful
      setRequestSuccess(true);
      setRequestError(null);
      setSelectedRoleId(null);
      setMessage('');
    } catch (err) {
      console.error('Error sending join request:', err);
      setRequestSuccess(false);
      setRequestError(err instanceof Error ? err.message : 'Failed to send join request');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter out startups:
  // 1. Owned by the current user
  // 2. User is already a member of
  const availableStartups = startups.filter(startup => 
    !userStartupIds.has(startup.id)
  );

  // Get all unique industries
  const industries = Array.from(new Set(
    availableStartups
      .map(startup => startup.industry)
      .filter(industry => industry)
  ));

  // Filter by industry if selected
  const filteredStartups = industryFilter 
    ? availableStartups.filter(startup => startup.industry === industryFilter)
    : availableStartups;
  
  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading startups...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }
  
  if (selectedStartup) {
    // Get the selected role if any
    const selectedRole = selectedRoleId 
      ? selectedStartup.roles.find(role => role.id === selectedRoleId)
      : null;
    
    return (
      <div className="container-fluid py-4 px-lg-5">
        <div className="row">
          <div className="col-lg-10 mx-auto">
        <button 
              className="btn btn-outline-primary mb-4"
          onClick={handleBackToList}
        >
              <i className="bi bi-arrow-left me-2"></i> Back to Startups
        </button>
        
        {requestSuccess && (
              <div className="alert alert-success mb-4 shadow-sm" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i> Your join request has been sent successfully!
          </div>
        )}
        
        {requestError && (
              <div className="alert alert-danger mb-4 shadow-sm" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {requestError}
          </div>
        )}
        
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body">
            <StartupDetail 
                      startup={selectedStartup as any} 
              onSelectRole={handleSelectRole}
            />
          </div>
                </div>
          </div>
          
              <div className="col-lg-4">
                {isAuthenticated && selectedRoleId && selectedRole ? (
                  <div className="card shadow-sm border-0 h-100">
                    <div className="card-header bg-primary text-white py-3">
                      <h4 className="mb-0 fw-bold">Apply for Role</h4>
                </div>
                <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <span className="badge bg-success me-2">Open Position</span>
                        <h5 className="mb-0 fw-bold">{selectedRole.title}</h5>
                      </div>
                  <form onSubmit={handleSubmitJoinRequest}>
                    <div className="mb-3">
                          <label htmlFor="message" className="form-label fw-bold">
                            Why are you a good fit for this role?
                      </label>
                      <textarea 
                        id="message"
                        className="form-control"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSubmitting}
                            placeholder="Tell the startup owner about your relevant skills and experience..."
                      />
                    </div>
                    <div className="d-grid">
                      <button 
                        type="submit" 
                            className="btn btn-primary py-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending Request...
                          </>
                        ) : 'Send Join Request'}
                      </button>
                    </div>
                  </form>
                </div>
                  </div>
                ) : (
                  <div className="card shadow-sm border-0 bg-light h-100">
                    <div className="card-body d-flex flex-column justify-content-center text-center p-4">
                      <div className="py-4">
                        <i className="bi bi-cursor-fill text-primary fs-1 mb-3"></i>
                        <h4 className="fw-bold mb-3">Interested in joining?</h4>
                        <p className="mb-0">Click on an open position from the list to apply.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container-fluid p-0">
      {/* Hero Banner */}
      <div className="bg-primary text-white py-5 mb-5" style={{ 
        background: 'linear-gradient(135deg, #6C5CE7 0%, #8E44AD 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-3">Find Your Dream Startup</h1>
              <p className="lead mb-4">Discover exciting startups and join teams that match your skills and passion.</p>
            </div>
            <div className="col-lg-6 d-none d-lg-block text-center">
              <i className="bi bi-people-fill" style={{ fontSize: '8rem', opacity: 0.8 }}></i>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mb-5">
        <div className="row">
          <div className="col-lg-10 mx-auto">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold">Available Startups</h2>
              
              <div className="d-flex align-items-center">
                <div className="form-group mb-0">
                  <select 
                    className="form-select"
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                  >
                    <option value="">All Industries</option>
                    {industries.map((industry, index) => (
                      <option key={index} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {filteredStartups.length === 0 ? (
              <div className="card shadow-sm border-0 p-4 text-center">
                <div className="py-5">
                  <i className="bi bi-search text-muted fs-1 mb-3"></i>
                  <h3 className="fw-bold">No available startups found</h3>
                  <p className="text-muted mb-0">Check back later or try a different industry filter.</p>
                </div>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {filteredStartups.map(startup => (
            <div className="col" key={startup.id}>
                    <div 
                      className="card h-100 shadow-sm border-0 startup-card" 
                onClick={() => handleSelectStartup(startup)}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div className="card-header border-0 bg-white pt-3">
                        <h5 className="fw-bold mb-1">{startup.name}</h5>
                        <div className="d-flex align-items-center">
                          <span className="badge bg-primary me-2">{startup.stage}</span>
                          {startup.industry && (
                            <span className="badge bg-secondary">{startup.industry}</span>
                          )}
                        </div>
                      </div>
                      <div className="card-body">
                        <p className="card-text">
                          {startup.details.length > 100 
                            ? `${startup.details.substring(0, 100)}...` 
                            : startup.details}
                        </p>
                        
                        <div className="mt-3">
                          <p className="text-muted mb-2 small fw-bold">
                            <i className="bi bi-briefcase me-2"></i>Open Positions:
                          </p>
                          <div>
                            {startup.roles.filter(role => role.isOpen).length > 0 ? (
                              startup.roles.filter(role => role.isOpen).map((role, index) => (
                                <span 
                                  key={role.id} 
                                  className="badge bg-light text-dark me-1 mb-1"
                                  style={{ border: '1px solid #ddd' }}
                                >
                                  {role.title}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted small">No open positions at the moment</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="card-footer bg-white border-0">
                        <div className="d-grid">
                          <button className="btn btn-outline-primary">
                            View Details <i className="bi bi-arrow-right ms-1"></i>
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
      </div>
    </div>
  );
};

export default JoinStartupPage; 