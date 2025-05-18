import React, { useState } from 'react';
import { StartupFormData, RoleData } from '../types';
import { useAuth } from '../context/AuthContext';

interface StartupFormProps {
  onStartupAdded: () => void;
}

const roleTypes = [
  'Admin',
  'Manager',
  'Employee - Tech and Design',
  'Employee - Operations, Sales, and Marketing'
];

const industryOptions = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "E-commerce",
  "Media & Entertainment",
  "Travel & Hospitality",
  "Food & Beverage",
  "Manufacturing",
  "Real Estate",
  "Other"
];

const StartupForm: React.FC<StartupFormProps> = ({ onStartupAdded }) => {
  const { isAuthenticated, addPoints, user } = useAuth();
  const [formData, setFormData] = useState<StartupFormData>({
    name: '',
    description: '',
    location: '',
    industry: '',
    logo: '',
    banner: '',
    mission: '',
    vision: '',
    roles: [
      { title: '', roleType: 'Technical', isOpen: true, isPaid: false }
    ]
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (index: number, field: keyof RoleData, value: string | boolean) => {
    const updatedRoles = [...formData.roles];
    updatedRoles[index] = { 
      ...updatedRoles[index], 
      [field]: value 
    };
    setFormData(prev => ({
      ...prev,
      roles: updatedRoles
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (name === 'logoFile') {
          setLogoFile(file);
          setLogoPreview(reader.result as string);
        } else if (name === 'bannerFile') {
          setBannerFile(file);
          setBannerPreview(reader.result as string);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const addRoleField = () => {
    if (formData.roles.length >= 5) {
      setError('Maximum 5 roles allowed');
      return;
    }
    
    setFormData({
      ...formData,
      roles: [
        ...formData.roles,
        { title: '', roleType: 'Technical', isOpen: true, isPaid: false }
      ]
    });
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
    if (!formData.name || !formData.description || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate roles
    if (formData.roles.some(role => !role.title.trim() || !role.roleType)) {
      setError('Please fill in all role fields with both title and role type');
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
      
      // Create FormData for file uploads
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('description', formData.description);
      formDataObj.append('location', formData.location);
      formDataObj.append('industry', formData.industry);
      
      // Don't include mission and vision as they don't exist in the database
      // formDataObj.append('mission', formData.mission);
      // formDataObj.append('vision', formData.vision);
      
      // Add logo file if selected
      if (logoFile) {
        formDataObj.append('logo', logoFile);
      }
      
      // Add banner file if selected
      if (bannerFile) {
        formDataObj.append('banner', bannerFile);
      }
      
      // Add roles as JSON
      formDataObj.append('roles', JSON.stringify(formData.roles.filter(role => role.title.trim() !== '')));
      
      const response = await fetch('/api/startups', {
        method: 'POST',
        headers: {
          'x-auth-token': token || ''
        },
        body: formDataObj
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register startup');
      }
      
      const createdStartup = await response.json();
      
      // Award points for creating a startup
      await addPoints(100, `Created startup: ${formData.name}`, { startupId: createdStartup.id });
      
      // Add achievement notification
      try {
        const NotificationService = (await import('../services/NotificationService')).default;
        if (user) {
          await NotificationService.awardAchievementIfNew(
            user.id,
            NotificationService.ACHIEVEMENTS.FIRST_STARTUP_CREATED,
            token || ''
          );
        }
      } catch (achievementError) {
        console.error('Error awarding achievement:', achievementError);
        // Don't let this error affect the rest of the flow
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        location: '',
        industry: '',
        logo: '',
        banner: '',
        mission: '',
        vision: '',
        roles: [{ title: '', roleType: 'Technical', isOpen: true, isPaid: false }]
      });
      setLogoFile(null);
      setBannerFile(null);
      setLogoPreview('');
      setBannerPreview('');
      
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
        
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label htmlFor="name" className="form-label fw-bold">Startup Name*</label>
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

          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="industry" className="form-label fw-bold">Industry</label>
              <select
                className="form-select"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
              >
                <option value="">Select industry</option>
                {industryOptions.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label htmlFor="location" className="form-label fw-bold">Location</label>
              <input
                type="text"
                className="form-control"
                id="location"
                name="location"
                placeholder="City, Country"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="description" className="form-label fw-bold">Startup Description*</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Logo</label>
              <input
                type="file"
                className="form-control"
                id="logoFile"
                name="logoFile"
                onChange={handleFileChange}
                accept="image/*"
              />
              <div className="form-text">Upload your company logo image (max 2MB)</div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Banner</label>
              <input
                type="file"
                className="form-control"
                id="bannerFile"
                name="bannerFile"
                onChange={handleFileChange}
                accept="image/*"
              />
              <div className="form-text">Upload your company banner image (max 2MB)</div>
            </div>
          </div>

          {logoPreview && (
            <div className="mb-3">
              <label className="form-label">Logo Preview</label>
              <div className="d-flex justify-content-center align-items-center border rounded p-3 bg-light" style={{ maxHeight: '150px' }}>
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="img-fluid" 
                  style={{ maxHeight: '100px' }}
                />
              </div>
            </div>
          )}

          {bannerPreview && (
            <div className="mb-3">
              <label className="form-label">Banner Preview</label>
              <div className="d-flex justify-content-center align-items-center border rounded p-3 bg-light">
                <img 
                  src={bannerPreview} 
                  alt="Banner preview" 
                  className="img-fluid" 
                  style={{ maxHeight: '150px', width: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <label className="form-label fw-bold">Roles* (up to 5)</label>
            {formData.roles.map((role, index) => (
              <div key={index} className="mb-4 p-3 border rounded bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Role {index + 1}</h5>
                  {formData.roles.length > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-sm btn-danger" 
                      onClick={() => removeRoleField(index)}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={role.title}
                      onChange={(e) => handleRoleChange(index, 'title', e.target.value)}
                      placeholder="e.g., CTO, Marketing Lead"
                      required
                    />
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Role Type *</label>
                    <select
                      className="form-select"
                      value={role.roleType}
                      onChange={(e) => handleRoleChange(index, 'roleType', e.target.value)}
                      required
                    >
                      {roleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`isPaid-${index}`}
                    checked={role.isPaid}
                    onChange={(e) => handleRoleChange(index, 'isPaid', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor={`isPaid-${index}`}>
                    This is a paid position
                  </label>
                </div>
              </div>
            ))}
            
            {formData.roles.length < 5 && (
              <button
                type="button"
                className="btn btn-outline-primary w-100"
                onClick={addRoleField}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Another Role
              </button>
            )}
          </div>
          
          <div className="d-grid">
            <button 
              type="submit"
              className="btn btn-primary btn-lg"
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