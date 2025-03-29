import React, { useState, useEffect, useContext } from 'react';
import { Startup, Role, JoinRequestFormData } from '../../types';
import { AuthContext } from '../../context/AuthContext';
import StartupCard from './StartupCard';
import StartupDetail from './StartupDetail';
import axios from 'axios';

interface StartupDetailType extends Startup {
  owner: {
    id: string;
    name: string;
    email: string;
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
  
  const { isAuthenticated, user, token } = useContext(AuthContext);
  
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
          email: startup.owner.email
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
      <div className="container mt-4">
        <button 
          className="btn btn-outline-primary mb-3"
          onClick={handleBackToList}
        >
          &larr; Back to Startups
        </button>
        
        {requestSuccess && (
          <div className="alert alert-success mb-3" role="alert">
            Your join request has been sent successfully!
          </div>
        )}
        
        {requestError && (
          <div className="alert alert-danger mb-3" role="alert">
            {requestError}
          </div>
        )}
        
        <div className="row">
          <div className="col-md-8">
            <StartupDetail 
              startup={selectedStartup} 
              onSelectRole={handleSelectRole}
            />
          </div>
          
          {isAuthenticated && selectedRoleId && selectedRole && (
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">Apply for Role</h4>
                </div>
                <div className="card-body">
                  <h5>{selectedRole.title}</h5>
                  <form onSubmit={handleSubmitJoinRequest}>
                    <div className="mb-3">
                      <label htmlFor="message" className="form-label">
                        Why should you be selected and please let us know about your experience:
                      </label>
                      <textarea 
                        id="message"
                        className="form-control"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Tell the startup owner why you're a good fit and your relevant experience..."
                      />
                    </div>
                    <div className="d-grid">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
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
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mt-4">
      <h1 className="mb-4">Available Startups</h1>
      
      {availableStartups.length === 0 ? (
        <div className="alert alert-info">
          No available startups found. Check back later or create your own startup!
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {availableStartups.map(startup => (
            <div className="col" key={startup.id}>
              <StartupCard 
                startup={startup}
                onClick={() => handleSelectStartup(startup)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JoinStartupPage; 