import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import UserProfileModal from '../profile/UserProfileModal';

// Define types for the component
interface JoinRequestResponse {
  id: string;
  userId: string;
  roleId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: {
    id: string;
    title: string;
  };
}

interface StartupDetails {
  id: string;
  name: string;
  ownerId: string;
}

const ManageJoinRequestsPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [startup, setStartup] = useState<StartupDetails | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || !startupId) {
      setLoading(false);
      return;
    }

    const fetchStartupAndRequests = async () => {
      try {
        // First get startup details to verify ownership
        const startupResponse = await fetch(`/api/startups/${startupId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });

        if (!startupResponse.ok) {
          throw new Error('Failed to fetch startup details');
        }

        const startupData = await startupResponse.json();
        setStartup(startupData);

        // Verify if the current user is the owner
        if (startupData.ownerId !== user?.id) {
          throw new Error('You are not authorized to manage requests for this startup');
        }

        // Get join requests for this startup
        const requestsResponse = await fetch(`/api/join-requests/startup/${startupId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });

        if (!requestsResponse.ok) {
          throw new Error('Failed to fetch join requests');
        }

        const requestsData = await requestsResponse.json();
        setJoinRequests(requestsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStartupAndRequests();
  }, [isAuthenticated, startupId, user?.id]);

  const handleUpdateStatus = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      setActionLoading(requestId);
      
      const response = await fetch(`/api/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${status.toLowerCase()} request`);
      }

      const updatedRequest = await response.json();
      
      // Update the request in the state
      setJoinRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: updatedRequest.status } 
            : request
        )
      );

      // If the request was accepted, refresh the user's joined startups list
      if (status === 'ACCEPTED') {
        // Trigger a refresh of the joined startups list
        window.dispatchEvent(new CustomEvent('refreshJoinedStartups'));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Function to open the user profile modal
  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Please sign in to manage join requests.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
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
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/my-startups')}
        >
          Go Back to My Startups
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Join Requests for {startup?.name}</h2>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/my-startups')}
        >
          Back to My Startups
        </button>
      </div>
      
      {joinRequests.length === 0 ? (
        <div className="alert alert-info">
          No join requests for this startup yet.
        </div>
      ) :
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {joinRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div>
                      <button 
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => handleViewProfile(request.user.id)}
                      >
                        {request.user.name}
                      </button>
                    </div>
                    <small className="text-muted">{request.user.email}</small>
                  </td>
                  <td>{request.role.title}</td>
                  <td>
                    {request.message ? (
                      <div style={{ maxWidth: '200px', whiteSpace: 'pre-wrap' }}>
                        {request.message}
                      </div>
                    ) : (
                      <span className="text-muted">No message</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      request.status === 'PENDING' ? 'bg-warning' : 
                      request.status === 'ACCEPTED' ? 'bg-success' : 'bg-danger'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    {request.status === 'PENDING' && (
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleUpdateStatus(request.id, 'ACCEPTED')}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : 'Accept'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : 'Reject'}
                        </button>
                      </div>
                    )}
                    <div className="mt-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewProfile(request.user.id)}
                      >
                        <i className="bi bi-person-vcard me-1"></i> View Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
      
      {/* User Profile Modal */}
      <UserProfileModal 
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        userId={selectedUserId}
      />
    </div>
  );
};

export default ManageJoinRequestsPage; 