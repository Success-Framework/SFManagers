import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Define interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role?: {
    id: string;
    title: string;
    roleType: string;
  };
}

interface Role {
  id: string;
  title: string;
  roleType: string;
  isOpen: boolean;
  isPaid: boolean;
}

interface UserRoleUpdate {
  userId: string;
  roleId: string;
}

interface ManageUserRolesModalProps {
  startupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const roleTypes = [
  'Admin',
  'Manager',
  'Employee - Tech and Design',
  'Employee - Operations, Sales, and Marketing'
];

const ManageUserRolesModal: React.FC<ManageUserRolesModalProps> = ({ 
  startupId, 
  onClose, 
  onSuccess 
}) => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [updatingUser, setUpdatingUser] = useState<boolean>(false);

  // Fetch users and roles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch startup members
        const membersResponse = await axios.get(`/api/startups/${startupId}/members-with-roles`, {
          headers: { 'x-auth-token': token || '' }
        });
        
        // Fetch available roles
        const rolesResponse = await axios.get(`/api/startups/${startupId}/roles`, {
          headers: { 'x-auth-token': token || '' }
        });
        
        setUsers(membersResponse.data || []);
        setRoles(rolesResponse.data || []);
      } catch (err: any) {
        setError(err.response?.data?.msg || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [startupId, token]);

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRole) {
      setError('Please select both a user and a role');
      return;
    }
    
    setUpdatingUser(true);
    setError(null);
    
    try {
      await axios.put(
        `/api/startups/${startupId}/users/${selectedUser}/role`, 
        { roleId: selectedRole },
        { headers: { 'x-auth-token': token || '' } }
      );
      
      // Update users in state with the new role
      setUsers(users.map(user => {
        if (user.id === selectedUser) {
          const newRole = roles.find(r => r.id === selectedRole);
          return {
            ...user,
            role: newRole ? {
              id: newRole.id,
              title: newRole.title,
              roleType: newRole.roleType
            } : undefined
          };
        }
        return user;
      }));
      
      setSuccessMessage('User role updated successfully');
      setSelectedUser('');
      setSelectedRole('');
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error updating user role');
    } finally {
      setUpdatingUser(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="mb-0 fw-bold">Manage Team Members</h3>
        <button 
          type="button" 
          className="btn btn-outline-secondary"
          onClick={onClose}
        >
          <i className="bi bi-x-circle me-2"></i>
          Cancel
        </button>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="text-center my-3">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            {successMessage && (
              <div className="alert alert-success">{successMessage}</div>
            )}
            
            <div className="mb-4">
              <h6 className="mb-3">Update User Role</h6>
              <div className="row g-3">
                <div className="col-md-5">
                  <label htmlFor="user-select" className="form-label">Select User</label>
                  <select 
                    id="user-select" 
                    className="form-select" 
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label htmlFor="role-select" className="form-label">Assign Role</label>
                  <select 
                    id="role-select" 
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">Choose a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.title} ({role.roleType})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button 
                    className="btn btn-primary w-100" 
                    onClick={handleUpdateRole}
                    disabled={updatingUser || !selectedUser || !selectedRole}
                  >
                    {updatingUser ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    Update
                  </button>
                </div>
              </div>
            </div>
            
            <h6 className="mb-3">Current Users and Roles</h6>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Current Role</th>
                    <th>Role Type</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role?.title || 'No role assigned'}</td>
                      <td>{user.role?.roleType || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <div className="card-footer d-flex justify-content-end">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

export default ManageUserRolesModal; 