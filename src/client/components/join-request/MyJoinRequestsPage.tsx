import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface JoinRequest {
  id: string;
  userId: string;
  startupId: string;
  roleId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  receiverId: string;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    title: string;
    roleType?: string;
  };
  startup: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-warning';
    case 'ACCEPTED':
      return 'bg-success';
    case 'REJECTED':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
};

const MyJoinRequestsPage: React.FC = () => {
  const { isAuthenticated, token, user } = useAuth();
  const [sentRequests, setSentRequests] = useState<JoinRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch sent requests
        const sentResponse = await axios.get('/api/join-requests/me', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch received requests (where user is the receiver)
        const receivedResponse = await axios.get('/api/join-requests/received', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (Array.isArray(sentResponse.data)) {
          setSentRequests(sentResponse.data);
        }

        if (Array.isArray(receivedResponse.data)) {
          setReceivedRequests(receivedResponse.data);
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [isAuthenticated, token, user]);

  const handleRequestAction = async (requestId: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      await axios.patch(`/api/join-requests/${requestId}`, 
        { status: action },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update the received requests list with the new status
      setReceivedRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: action }
            : request
        )
      );
    } catch (err) {
      console.error('Error updating request:', err);
      setError('Failed to update request. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          Please sign in to view your join requests.
        </div>
      </div>
    );
  }

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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Join Requests</h2>
        <Link to="/browse-startups" className="btn btn-primary">
          Browse Startups
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          {error}
        </div>
      )}

      {/* Sent Requests Section */}
      <div className="mb-5">
        <h3 className="mb-3">Sent Requests</h3>
        {sentRequests.length === 0 ? (
          <div className="alert alert-info">
            You haven't sent any join requests yet. Browse startups to find opportunities to join!
          </div>
        ) : (
          <div className="row">
            {sentRequests.map(request => (
              <div key={request.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">{request.startup.name}</h5>
                    <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <h6>Role: {request.role.title}</h6>
                    {request.message && (
                      <div className="mb-3">
                        <strong>Your message:</strong>
                        <p className="text-muted">{request.message}</p>
                      </div>
                    )}
                    <div className="text-muted small">
                      <div>Sent on: {new Date(request.createdAt).toLocaleDateString()}</div>
                      {request.status !== 'PENDING' && (
                        <div>Updated on: {new Date(request.updatedAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top-0">
                    <Link 
                      to={`/startup/${request.startupId}`} 
                      className="btn btn-outline-primary w-100"
                    >
                      View Startup
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Received Requests Section */}
      <div className="mb-5">
        <h3 className="mb-3">Received Requests</h3>
        {receivedRequests.length === 0 ? (
          <div className="alert alert-info">
            You haven't received any join requests yet.
          </div>
        ) : (
          <div className="row">
            {receivedRequests.map(request => (
              <div key={request.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">{request.startup.name}</h5>
                    <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <h6>Role: {request.role.title}</h6>
                    <div className="mb-3">
                      <strong>From: </strong>
                      <span>{request.user?.name}</span>
                    </div>
                    {request.message && (
                      <div className="mb-3">
                        <strong>Message:</strong>
                        <p className="text-muted">{request.message}</p>
                      </div>
                    )}
                    <div className="text-muted small">
                      <div>Received on: {new Date(request.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top-0">
                    {request.status === 'PENDING' ? (
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-success flex-grow-1"
                          onClick={() => handleRequestAction(request.id, 'ACCEPTED')}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn btn-danger flex-grow-1"
                          onClick={() => handleRequestAction(request.id, 'REJECTED')}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <Link 
                        to={`/startup/${request.startupId}`} 
                        className="btn btn-outline-primary w-100"
                      >
                        View Startup
                      </Link>
                    )}
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

export default MyJoinRequestsPage; 