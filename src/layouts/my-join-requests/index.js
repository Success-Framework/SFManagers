import React, { useState, useEffect } from 'react';
import { getUserJoinRequests, getReceivedJoinRequests, updateJoinRequestStatus } from '../../api/joinRequest';

const MyJoinRequests = () => {
  const [appliedRequests, setAppliedRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Commented out API calls
      const [applied , received] = await Promise.all([
        getUserJoinRequests(),
        getReceivedJoinRequests()
      ]);

      // Dummy data for applied requests
      // const applied = [
      //   {
      //     "id": "jr-101",
      //     "userId": "user-001",
      //     "roleId": "role-301",
      //     "startupId": "startup-901",
      //     "status": "PENDING",
      //     "message": "Excited to be a part of the product team.",
      //     "receiverId": "owner-001",
      //     "createdAt": "2025-05-25T10:30:00.000Z",
      //     "updatedAt": "2025-05-25T10:30:00.000Z",
      //     "role": {
      //       "id": "role-301",
      //       "title": "Product Manager",
      //       "roleType": "FULL_TIME"
      //     },
      //     "startup": {
      //       "id": "startup-901",
      //       "name": "InnovateX"
      //     }
      //   },
      //   {
      //     "id": "jr-102",
      //     "userId": "user-001",
      //     "roleId": "role-302",
      //     "startupId": "startup-902",
      //     "status": "REJECTED",
      //     "message": "I have experience in frontend with ReactJS.",
      //     "receiverId": "owner-002",
      //     "createdAt": "2025-05-20T14:00:00.000Z",
      //     "updatedAt": "2025-05-21T09:10:00.000Z",
      //     "role": {
      //       "id": "role-302",
      //       "title": "Frontend Developer",
      //       "roleType": "INTERNSHIP"
      //     },
      //     "startup": {
      //       "id": "startup-902",
      //       "name": "TechSphere"
      //     }
      //   },
      //   {
      //     "id": "jr-103",
      //     "userId": "user-001",
      //     "roleId": "role-303",
      //     "startupId": "startup-903",
      //     "status": "ACCEPTED",
      //     "message": "Skilled in backend APIs and databases.",
      //     "receiverId": "owner-003",
      //     "createdAt": "2025-04-15T08:20:00.000Z",
      //     "updatedAt": "2025-04-17T13:45:00.000Z",
      //     "role": {
      //       "id": "role-303",
      //       "title": "Backend Developer",
      //       "roleType": "PART_TIME"
      //     },
      //     "startup": {
      //       "id": "startup-903",
      //       "name": "CodeNest"
      //     }
      //   }
      // ];

      // // Dummy data for received requests
      // const received = [
      //   {
      //     "id": "jr-789",
      //     "userId": "user-002",
      //     "roleId": "role-105",
      //     "startupId": "startup-304",
      //     "status": "PENDING",
      //     "message": "I am very passionate about frontend development.",
      //     "receiverId": "user-001",
      //     "createdAt": "2025-05-26T10:15:00.000Z",
      //     "updatedAt": "2025-05-26T10:15:00.000Z",
      //     "role": {
      //       "id": "role-105",
      //       "title": "Frontend Developer",
      //       "roleType": "FULL_TIME"
      //     },
      //     "startup": {
      //       "id": "startup-304",
      //       "name": "StartupStack"
      //     },
      //     "user": {
      //       "id": "user-002",
      //       "name": "Aman Sharma",
      //       "email": "aman@example.com"
      //     }
      //   },
      //   {
      //     "id": "jr-790",
      //     "userId": "user-005",
      //     "roleId": "role-106",
      //     "startupId": "startup-304",
      //     "status": "PENDING",
      //     "message": "Looking for a backend internship.",
      //     "receiverId": "user-001",
      //     "createdAt": "2025-05-25T14:20:00.000Z",
      //     "updatedAt": "2025-05-25T14:20:00.000Z",
      //     "role": {
      //       "id": "role-106",
      //       "title": "Backend Intern",
      //       "roleType": "INTERNSHIP"
      //     },
      //     "startup": {
      //       "id": "startup-304",
      //       "name": "StartupStack"
      //     },
      //     "user": {
      //       "id": "user-005",
      //       "name": "Priya Verma",
      //       "email": "priya@example.com"
      //     }
      //   }
      // ];

      setAppliedRequests(applied);
      setReceivedRequests(received);
    } catch (err) {
      setError('Failed to fetch requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      // Commented out API call
      // await updateJoinRequestStatus(requestId, status);
      
      // Simulate status update with dummy data
      setReceivedRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { ...request, status } 
            : request
        )
      );
    } catch (err) {
      console.error('Error updating request status:', err);
      setError('Failed to update request status');
    }
  };

  // ... rest of the component remains the same ...
  if (loading) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        Loading requests...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      marginLeft: '250px',
      width: 'calc(100% - 250px)',
      minHeight: '100vh',
      backgroundColor: '#0f1535'
    }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>My Join Requests</h2>
      
      {/* Applied For Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>Applied For</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          {appliedRequests.map((request) => (
            <div
              key={request.id}
              style={{
                background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                padding: '20px',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>{request.startup?.name}</h4>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  backgroundColor: request.status === 'PENDING' ? '#ffa726' : 
                                 request.status === 'ACCEPTED' ? '#66bb6a' : '#f44336',
                  fontSize: '0.875rem'
                }}>
                  {request.status}
                </span>
              </div>
              <p style={{ margin: '5px 0' }}><strong>Role:</strong> {request.role?.title}</p>
              <p style={{ margin: '5px 0' }}><strong>Applied:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
              {request.message && (
                <p style={{ margin: '5px 0' }}><strong>Message:</strong> {request.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Requests Received Section */}
      <div>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>Requests Received</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
        {receivedRequests.map((request) => (
            <div
              key={request.id}
              style={{
                background: 'linear-gradient(45deg, #1a237e 30%, #0d47a1 90%)',
                padding: '20px',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 style={{ margin: '0 0 10px 0' }}>{request.startup?.name}</h4>
              <p style={{ margin: '5px 0' }}><strong>Role:</strong> {request.role?.title}</p>
              <p style={{ margin: '5px 0' }}><strong>From:</strong> {request.user?.name}</p>
              <p style={{ margin: '5px 0' }}><strong>Received:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
              {request.message && (
                <p style={{ margin: '5px 0' }}><strong>Message:</strong> {request.message}</p>
              )}
              {request.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#4caf50',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onClick={() => handleStatusUpdate(request.id, 'ACCEPTED')}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#388e3c'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#4caf50'}
                  >
                    Accept
                  </button>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#f44336',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyJoinRequests;