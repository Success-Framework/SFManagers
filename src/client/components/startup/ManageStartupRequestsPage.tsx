import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
}

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
  ownerId: string;
  roles: Role[];
}

interface JoinRequest {
  id: string;
  userId: string;
  user: User;
  startupId: string;
  roleId: string;
  role: Role;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

const ManageStartupRequestsPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchStartupAndRequests();
  }, [isAuthenticated, startupId, statusFilter]);

  const fetchStartupAndRequests = async () => {
    if (!startupId) return;
    
    try {
      setLoading(true);
      
      // Fetch startup details
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
      
      // Check if user is the owner
      if (startupData.ownerId !== user?.id) {
        navigate('/home');
        return;
      }
      
      // Fetch join requests
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
      setRequests(requestsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!requestId) return;
    
    try {
      setActionLoading(requestId);
      
      const response = await fetch(`/api/join-requests/${requestId}/status`, {
        method: 'PUT',
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
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status } : req
        )
      );
      
      // If accepted, refresh the startup data to update roles
      if (status === 'ACCEPTED') {
        fetchStartupAndRequests();
      }
    } catch (err) {
      console.error('Error updating request status:', err);
      setError(err instanceof Error ? err.message : 'An error occurred updating request');
    } finally {
      setActionLoading(null);
    }
  };

  const openMessageModal = (requestId: string) => {
    setSelectedRequestId(requestId);
    setMessageModalOpen(true);
  };

  const closeMessageModal = () => {
    setSelectedRequestId(null);
    setMessageModalOpen(false);
  };

  const selectedRequest = selectedRequestId 
    ? requests.find(req => req.id === selectedRequestId)
    : null;

  const filteredRequests = requests.filter(req => 
    statusFilter === 'ALL' || req.status === statusFilter
  );

  const acceptRequest = async (requestId: string) => {
    try {
      setLoading(true);
      
      // Get the selected role for this request
      const selectedRole = memberRoles[requestId] || 'Employee - Marketing and Sales';
      
      await axios.post(
        `/api/startups/${startupId}/requests/${requestId}/accept`,
        { role: selectedRole }, // Send role information to the backend
        { headers: { 'x-auth-token': localStorage.getItem('token') || '' } }
      );
      
      setRequests(requests.filter(req => req.id !== requestId));
      setSuccess('Request accepted successfully!');
      
      // Refresh the members list
      fetchStartupAndRequests();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error accepting request');
    } finally {
      setLoading(false);
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
          Back to Startups
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0">Manage Join Requests</h1>
          <p className="text-muted">{startup.name}</p>
        </div>
        <button 
          className="btn btn-outline-primary"
          onClick={() => navigate(`/startup/${startupId}`)}
        >
          Back to Startup
        </button>
      </div>
      
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-light">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${statusFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setStatusFilter('PENDING')}
              >
                Pending
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${statusFilter === 'ACCEPTED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ACCEPTED')}
              >
                Approved
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${statusFilter === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('REJECTED')}
              >
                Rejected
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          {filteredRequests.length === 0 ? (
            <div className="alert alert-info">
              No {statusFilter.toLowerCase() === 'all' ? '' : statusFilter.toLowerCase()} join requests found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(request => (
                    <tr key={request.id}>
                      <td>{request.user.name}</td>
                      <td>{request.user.email}</td>
                      <td>{request.role.title}</td>
                      <td>
                        {request.message ? (
                          <button 
                            className="btn btn-sm btn-link p-0"
                            onClick={() => openMessageModal(request.id)}
                          >
                            View Message
                          </button>
                        ) : (
                          <span className="text-muted">No message</span>
                        )}
                      </td>
                      <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          request.status === 'ACCEPTED' 
                            ? 'bg-success' 
                            : request.status === 'REJECTED' 
                              ? 'bg-danger' 
                              : 'bg-warning'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {request.status === 'PENDING' && (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => {
                                // Show role selection before accepting
                                setSelectedRequestId(request.id);
                                setRoleModalOpen(true);
                              }}
                              disabled={loading}
                            >
                              Accept
                            </button>
                            <button 
                              className="btn btn-danger"
                              onClick={() => handleUpdateRequestStatus(request.id, 'REJECTED')}
                              disabled={actionLoading === request.id}
                            >
                              {actionLoading === request.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : 'Reject'}
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
      </div>

      {/* Message Modal */}
      {messageModalOpen && selectedRequest && (
        <div className="modal fade show" style={{display: 'block'}} tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Application Message</h5>
                <button type="button" className="btn-close" onClick={closeMessageModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p className="mb-2"><strong>From:</strong> {selectedRequest.user.name}</p>
                <p className="mb-2"><strong>Role:</strong> {selectedRequest.role.title}</p>
                <div className="card bg-light p-3 mt-3">
                  <p className="mb-0">{selectedRequest.message || 'No message provided.'}</p>
                </div>
              </div>
              <div className="modal-footer">
                {selectedRequest.status === 'PENDING' && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-success"
                      onClick={() => {
                        handleUpdateRequestStatus(selectedRequest.id, 'ACCEPTED');
                        closeMessageModal();
                      }}
                      disabled={actionLoading === selectedRequest.id}
                    >
                      Approve
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={() => {
                        handleUpdateRequestStatus(selectedRequest.id, 'REJECTED');
                        closeMessageModal();
                      }}
                      disabled={actionLoading === selectedRequest.id}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeMessageModal}>Close</button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}

      {/* Role Modal */}
      {roleModalOpen && selectedRequestId && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Role</h5>
                <button type="button" className="btn-close" onClick={() => setRoleModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Select Role for Member</label>
                  <select 
                    className="form-select" 
                    id="role"
                    value={memberRoles[selectedRequestId] || 'Employee - Marketing and Sales'}
                    onChange={(e) => setMemberRoles({
                      ...memberRoles,
                      [selectedRequestId]: e.target.value
                    })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Employee - Marketing and Sales">Employee - Marketing and Sales</option>
                    <option value="Employee - Tech and Product">Employee - Tech and Product</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRoleModalOpen(false)}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    acceptRequest(selectedRequestId);
                    setRoleModalOpen(false);
                  }}
                >
                  Accept Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStartupRequestsPage; 