import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// Define a type that matches the structure of the API response
interface JoinRequestResponse {
  id: string;
  userId: string;
  roleId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
  createdAt: string;
  updatedAt: string;
  role?: {
    id: string;
    title: string;
    startup?: {
      id: string;
      name: string;
      stage: string;
    };
  };
}

const MyJoinRequestsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [joinRequests, setJoinRequests] = useState<JoinRequestResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchJoinRequests = async () => {
      try {
        const response = await fetch('/api/join-requests/me', {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token') || ''
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch your join requests');
        }

        const data = await response.json();
        setJoinRequests(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchJoinRequests();
  }, [isAuthenticated]);

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this join request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/join-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel join request');
      }

      // Remove the canceled request from the state
      setJoinRequests((prevRequests) => 
        prevRequests.filter((request) => request.id !== requestId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

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
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">My Join Requests</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {joinRequests.length === 0 ? (
        <div className="alert alert-info">
          You haven't sent any join requests yet.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Startup</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {joinRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.role?.startup?.name || 'Unknown Startup'}</td>
                  <td>{request.role?.title || 'Unknown Role'}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    {request.status === 'PENDING' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancel
                      </button>
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

export default MyJoinRequestsPage; 