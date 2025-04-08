import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Role {
  id: string;
  title: string;
  roleType: string;
  isOpen: boolean;
  isPaid: boolean;
  assignedUser?: User;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  logo?: string;
  website?: string;
  location?: string;
  industry?: string;
  ownerId: string;
  owner: User;
  roles: Role[];
  createdAt: string;
}

interface ManageRolesModalProps {
  startup: Startup;
  onSave: () => void;
  onCancel: () => void;
}

// New role form
interface NewRoleForm {
  title: string;
  roleType: string;
  isOpen: boolean;
  isPaid: boolean;
}

// Edit role form
interface EditRoleForm {
  id: string;
  title: string;
  roleType: string;
  isOpen: boolean;
  isPaid: boolean;
}

const roleTypes = [
  'Admin',
  'Manager',
  'Employee - Tech and Design',
  'Employee - Operations, Sales, and Marketing'
];

const ManageRolesModal: React.FC<ManageRolesModalProps> = ({ startup, onSave, onCancel }) => {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>(startup.roles);
  const [newRoles, setNewRoles] = useState<NewRoleForm[]>([]);
  const [editRole, setEditRole] = useState<EditRoleForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Add a new role form
  const addNewRoleForm = () => {
    setNewRoles([
      ...newRoles,
      { title: '', roleType: roleTypes[0], isOpen: true, isPaid: false }
    ]);
  };
  
  // Update new role form
  const updateNewRoleForm = (index: number, field: keyof NewRoleForm, value: string | boolean) => {
    const updatedNewRoles = [...newRoles];
    updatedNewRoles[index] = {
      ...updatedNewRoles[index],
      [field]: value
    };
    setNewRoles(updatedNewRoles);
  };
  
  // Remove new role form
  const removeNewRoleForm = (index: number) => {
    setNewRoles(newRoles.filter((_, i) => i !== index));
  };
  
  // Open edit role form
  const openEditRoleForm = (role: Role) => {
    setEditRole({
      id: role.id,
      title: role.title,
      roleType: role.roleType,
      isOpen: role.isOpen,
      isPaid: role.isPaid
    });
  };
  
  // Update edit role form
  const updateEditRoleForm = (field: keyof EditRoleForm, value: string | boolean) => {
    if (editRole) {
      setEditRole({
        ...editRole,
        [field]: value
      });
    }
  };
  
  // Cancel edit role form
  const cancelEditRoleForm = () => {
    setEditRole(null);
  };
  
  // Submit new roles
  const handleAddRoles = async () => {
    // Validate new roles
    for (const role of newRoles) {
      if (!role.title || !role.roleType) {
        setError('Each role must have a title and role type');
        return;
      }
    }
    
    if (newRoles.length === 0) {
      setError('Please add at least one role');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/startups/${startup.id}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({ roles: newRoles })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add roles');
      }
      
      const data = await response.json();
      setRoles([...roles, ...data.addedRoles]);
      setNewRoles([]);
      setSuccess('Roles added successfully!');
      
      // Clear success message after a short delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Update role
  const handleUpdateRole = async () => {
    if (!editRole) return;
    
    if (!editRole.title || !editRole.roleType) {
      setError('Title and role type are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/startups/roles/${editRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          title: editRole.title,
          roleType: editRole.roleType,
          isOpen: editRole.isOpen,
          isPaid: editRole.isPaid
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      
      const data = await response.json();
      
      // Update the role in the local state
      setRoles(roles.map(role => 
        role.id === editRole.id ? data.role : role
      ));
      
      setEditRole(null);
      setSuccess('Role updated successfully!');
      
      // Clear success message after a short delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete role
  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/startups/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete role');
      }
      
      // Remove the role from the local state
      setRoles(roles.filter(role => role.id !== roleId));
      setSuccess('Role deleted successfully!');
      
      // Clear success message after a short delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveChanges = () => {
    onSave();
  };

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Manage Roles - {startup.name}</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            {/* Messages */}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}
            
            {/* Current Roles */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">Current Roles</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center">No roles yet</td>
                        </tr>
                      ) : (
                        roles.map(role => (
                          <tr key={role.id}>
                            <td>{role.title}</td>
                            <td>{role.roleType}</td>
                            <td>
                              <span className={`badge ${role.isOpen ? 'bg-success' : 'bg-secondary'}`}>
                                {role.isOpen ? 'Open' : 'Filled'}
                              </span>
                            </td>
                            <td>{role.assignedUser ? role.assignedUser.name : '-'}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                {role.isPaid ? (
                                  <span className="badge bg-info me-2">Paid</span>
                                ) : (
                                  <span className="badge bg-secondary me-2">Volunteer</span>
                                )}
                                <div className="btn-group btn-group-sm ms-2">
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => openEditRoleForm(role)}
                                    disabled={loading}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  {!role.assignedUser && (
                                    <button 
                                      className="btn btn-outline-danger"
                                      onClick={() => handleDeleteRole(role.id)}
                                      disabled={loading}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Edit Role Form */}
            {editRole && (
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fw-bold">Edit Role</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit-title" className="form-label fw-bold">Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="edit-title"
                        value={editRole.title}
                        onChange={(e) => updateEditRoleForm('title', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="edit-roleType" className="form-label fw-bold">Role Type *</label>
                      <select
                        className="form-select"
                        id="edit-roleType"
                        value={editRole.roleType}
                        onChange={(e) => updateEditRoleForm('roleType', e.target.value)}
                        required
                      >
                        {roleTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="edit-isOpen"
                        checked={editRole.isOpen}
                        onChange={(e) => updateEditRoleForm('isOpen', e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="edit-isOpen">
                        Open for applications
                      </label>
                    </div>
                    <div className="form-check mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="edit-isPaid"
                        checked={editRole.isPaid}
                        onChange={(e) => updateEditRoleForm('isPaid', e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="edit-isPaid">
                        This is a paid position
                      </label>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cancelEditRoleForm}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleUpdateRole}
                      disabled={loading}
                    >
                      Update Role
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add New Roles */}
            <div className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Add New Roles</h5>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addNewRoleForm}
                >
                  <i className="bi bi-plus"></i> Add Role
                </button>
              </div>
              <div className="card-body">
                {newRoles.length === 0 ? (
                  <p className="text-muted mb-0">Click "Add Role" to add new roles to this startup.</p>
                ) : (
                  <>
                    {newRoles.map((role, index) => (
                      <div key={index} className="card mb-3 border-light">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">New Role #{index + 1}</h6>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => removeNewRoleForm(index)}
                          ></button>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-bold">Title *</label>
                              <input
                                type="text"
                                className="form-control"
                                value={role.title}
                                onChange={(e) => updateNewRoleForm(index, 'title', e.target.value)}
                                placeholder="e.g., Marketing Lead"
                                required
                              />
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label className="form-label fw-bold">Role Type *</label>
                              <select
                                className="form-select"
                                value={role.roleType}
                                onChange={(e) => updateNewRoleForm(index, 'roleType', e.target.value)}
                                required
                              >
                                {roleTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`isPaid-${index}`}
                              checked={role.isPaid}
                              onChange={(e) => updateNewRoleForm(index, 'isPaid', e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`isPaid-${index}`}>
                              This is a paid position
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="d-flex justify-content-end mt-3">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleAddRoles}
                        disabled={loading || newRoles.length === 0}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Adding...
                          </>
                        ) : 'Add Roles'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-outline-secondary" 
              onClick={onCancel}
            >
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSaveChanges}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRolesModal; 