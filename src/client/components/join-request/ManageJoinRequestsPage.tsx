import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(null);
    }
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
      ) : (
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
                    <div>{request.user.name}</div>
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
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateStatus(request.id, 'ACCEPTED')}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === request.id ? (
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          ) : null}
                          Accept
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === request.id ? (
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          ) : null}
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageJoinRequestsPage; 