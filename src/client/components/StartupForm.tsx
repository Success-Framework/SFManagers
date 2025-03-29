import React, { useState } from 'react';
import { StartupFormData } from '../types';
import { useAuth } from '../context/AuthContext';

interface StartupFormProps {
  onStartupAdded: () => void;
}

const StartupForm: React.FC<StartupFormProps> = ({ onStartupAdded }) => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<StartupFormData>({
    name: '',
    details: '',
    stage: '',
    roles: ['']
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (index: number, value: string) => {
    const updatedRoles = [...formData.roles];
    updatedRoles[index] = value;
    setFormData(prev => ({
      ...prev,
      roles: updatedRoles
    }));
  };

  const addRoleField = () => {
    if (formData.roles.length >= 5) {
      alert('You can add up to 5 roles only');
      return;
    }
    setFormData(prev => ({
      ...prev,
      roles: [...prev.roles, '']
    }));
  };

  const removeRoleField = (index: number) => {
    if (formData.roles.length <= 1) {
      return;
    }
    const updatedRoles = formData.roles.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      roles: updatedRoles
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.details || !formData.stage || formData.roles.some(role => !role.trim())) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to register a startup');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/startups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          name: formData.name,
          details: formData.details,
          stage: formData.stage,
          roles: formData.roles.filter(role => role.trim() !== '')
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register startup');
      }
      
      // Reset form
      setFormData({
        name: '',
        details: '',
        stage: '',
        roles: ['']
      });
      
      // Notify parent
      onStartupAdded();
      
      alert('Startup registered successfully!');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card shadow mb-4">
      <div className="card-header">
        <h2 className="text-center mb-0">Register New Startup</h2>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Startup Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="details" className="form-label">Startup Details</label>
            <textarea
              className="form-control"
              id="details"
              name="details"
              rows={3}
              value={formData.details}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="stage" className="form-label">Startup Stage</label>
            <select
              className="form-select"
              id="stage"
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select stage</option>
              <option value="Idea">Idea</option>
              <option value="MVP">MVP</option>
              <option value="Pre-seed">Pre-seed</option>
              <option value="Seed">Seed</option>
              <option value="Series A">Series A</option>
              <option value="Series B or later">Series B or later</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Roles Available (up to 5)</label>
            {formData.roles.map((role, index) => (
              <div className="input-group mb-2" key={index}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Role title"
                  value={role}
                  onChange={(e) => handleRoleChange(index, e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeRoleField(index)}
                  disabled={formData.roles.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary mt-2"
              onClick={addRoleField}
              disabled={formData.roles.length >= 5}
            >
              Add Another Role
            </button>
            <small className="form-text text-muted d-block">You can add up to 5 roles.</small>
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
                  Registering...
                </>
              ) : 'Register Startup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartupForm; 