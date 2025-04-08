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
  banner?: string;
  website?: string;
  location?: string;
  industry?: string;
  ownerId: string;
  owner: User;
  roles: Role[];
  createdAt: string;
}

interface EditStartupModalProps {
  startup: Startup;
  onSave: (startup: Startup) => void;
  onCancel: () => void;
}

const EditStartupModal: React.FC<EditStartupModalProps> = ({ startup, onSave, onCancel }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: startup.name,
    details: startup.details,
    stage: startup.stage,
    logo: startup.logo || '',
    banner: startup.banner || '',
    website: startup.website || '',
    location: startup.location || '',
    industry: startup.industry || ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      if (name === 'logoFile') {
        setLogoFile(files[0]);
      } else if (name === 'bannerFile') {
        setBannerFile(files[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.details || !formData.stage) {
      setError('Name, details, and stage are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create FormData for file uploads
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('details', formData.details);
      formDataObj.append('stage', formData.stage);
      formDataObj.append('location', formData.location || '');
      formDataObj.append('industry', formData.industry || '');
      formDataObj.append('website', formData.website || '');
      
      // Add files if selected
      if (logoFile) {
        formDataObj.append('logo', logoFile);
      } else if (formData.logo) {
        formDataObj.append('logoUrl', formData.logo);
      }
      
      if (bannerFile) {
        formDataObj.append('banner', bannerFile);
      } else if (formData.banner) {
        formDataObj.append('bannerUrl', formData.banner);
      }
      
      const response = await fetch(`/api/startups/${startup.id}`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token || ''
        },
        body: formDataObj
      });
      
      if (!response.ok) {
        throw new Error('Failed to update startup');
      }
      
      const updatedStartup = await response.json();
      setSuccess('Startup updated successfully!');
      
      // Wait a moment to show the success message, then close the modal
      setTimeout(() => {
        onSave(updatedStartup);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const stageOptions = ['Idea', 'Prototype', 'Seed', 'Growth', 'Scale'];
  const industryOptions = [
    'Technology',
    'Healthcare',
    'Education',
    'Finance',
    'E-commerce',
    'Media & Entertainment',
    'Travel & Hospitality',
    'Food & Beverage',
    'Manufacturing',
    'Real Estate',
    'Other'
  ];

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Edit Startup</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="modal-body">
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
              
              <div className="mb-3">
                <label htmlFor="name" className="form-label fw-bold">Startup Name *</label>
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
                <label htmlFor="stage" className="form-label fw-bold">Stage *</label>
                <select
                  className="form-select"
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a stage</option>
                  {stageOptions.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="industry" className="form-label fw-bold">Industry</label>
                <select
                  className="form-select"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                >
                  <option value="">Select an industry</option>
                  {industryOptions.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="location" className="form-label fw-bold">Location</label>
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="website" className="form-label fw-bold">Website</label>
                <input
                  type="url"
                  className="form-control"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Logo</label>
                <div className="input-group mb-3">
                  <input
                    type="file"
                    className="form-control"
                    id="logoFile"
                    name="logoFile"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
                {formData.logo && !logoFile && (
                  <div className="mt-2">
                    <small className="text-muted">Current logo:</small>
                    <div className="mt-1 p-2 border rounded" style={{ maxWidth: '150px' }}>
                      <img 
                        src={formData.logo} 
                        alt="Current Logo" 
                        className="img-fluid"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-bold">Banner</label>
                <div className="input-group mb-3">
                  <input
                    type="file"
                    className="form-control"
                    id="bannerFile"
                    name="bannerFile"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
                {formData.banner && !bannerFile && (
                  <div className="mt-2">
                    <small className="text-muted">Current banner:</small>
                    <div className="mt-1 p-2 border rounded">
                      <img 
                        src={formData.banner} 
                        alt="Current Banner" 
                        className="img-fluid"
                        style={{ maxHeight: '100px' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/800x200?text=Invalid+URL';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-3">
                <label htmlFor="details" className="form-label fw-bold">Details *</label>
                <textarea
                  className="form-control"
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows={5}
                  required
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={onCancel}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStartupModal; 