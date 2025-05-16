import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  handleFileChange as handleImageFileChange, 
  handleImageDelete, 
  prepareFormDataWithImages 
} from '../../utils/imageUpload';

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
  const navigate = useNavigate();
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isLogoDeleted, setIsLogoDeleted] = useState(false);
  const [isBannerDeleted, setIsBannerDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Initialize image previews with a timestamp to prevent caching issues
  useEffect(() => {
    if (startup.logo) {
      const logoUrl = `${startup.logo}?t=${Date.now()}`;
      setLogoPreview(logoUrl);
    }
    
    if (startup.banner) {
      const bannerUrl = `${startup.banner}?t=${Date.now()}`;
      setBannerPreview(bannerUrl);
    }
  }, [startup.logo, startup.banner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      console.log(`Selected ${name} file:`, files[0].name, files[0].size, files[0].type);
      
      if (name === 'logo') {
        console.log('Setting logo file:', files[0]);
        handleImageFileChange(
          files[0],
          setLogoFile,
          setLogoPreview,
          setIsLogoDeleted
        );
      } else if (name === 'banner') {
        console.log('Setting banner file:', files[0]);
        handleImageFileChange(
          files[0],
          setBannerFile,
          setBannerPreview,
          setIsBannerDeleted
        );
      }
    }
  }, []);
  
  const handleDeleteLogo = useCallback(() => {
    handleImageDelete(setLogoFile, setLogoPreview, setIsLogoDeleted);
    setFormData(prev => ({ ...prev, logo: '' }));
  }, []);
  
  const handleDeleteBanner = useCallback(() => {
    handleImageDelete(setBannerFile, setBannerPreview, setIsBannerDeleted);
    setFormData(prev => ({ ...prev, banner: '' }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.details || !formData.stage) {
      setError('Name, details, and stage are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Preparing to submit form data', {
        name: formData.name,
        logoFile: logoFile ? `Logo file size: ${logoFile.size}` : null,
        isLogoDeleted,
        bannerFile: bannerFile ? `Banner file size: ${bannerFile.size}` : null,
        isBannerDeleted
      });
      
      // Create FormData for file uploads
      const formDataObj = prepareFormDataWithImages(
        {
          name: formData.name,
          details: formData.details,
          stage: formData.stage,
          location: formData.location || '',
          industry: formData.industry || '',
          website: formData.website || '',
          logoUrl: (!logoFile && formData.logo && !isLogoDeleted) ? formData.logo : '',
          bannerUrl: (!bannerFile && formData.banner && !isBannerDeleted) ? formData.banner : ''
        },
        {
          logo: {
            file: logoFile,
            isDeleted: isLogoDeleted,
            fieldName: 'logo',
            deleteFlag: 'deleteLogo'
          },
          banner: {
            file: bannerFile,
            isDeleted: isBannerDeleted,
            fieldName: 'banner',
            deleteFlag: 'deleteBanner'
          }
        }
      );
      
      // Log formData entries for debugging
      // Convert entries to array first to avoid TypeScript iterator issues
      Array.from(formDataObj.entries()).forEach(pair => {
        console.log('FormData entry:', pair[0], 
          pair[0] === 'logo' || pair[0] === 'banner' 
            ? 'File object present' 
            : pair[1]
        );
      });
      
      const response = await fetch(`/api/startups/${startup.id}`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token || ''
        },
        body: formDataObj
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from server:', errorText);
        throw new Error(`Failed to update startup: ${errorText}`);
      }
      
      const updatedStartup = await response.json();
      console.log('Startup successfully updated:', updatedStartup);
      setSuccess('Startup updated successfully!');
      
      // Call onSave immediately with the updated startup data
      onSave(updatedStartup);
      
      // No need for setTimeout that could cause issues
      setLoading(false);
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
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0 fw-bold">Edit Startup</h3>
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={onCancel}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancel
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} encType="multipart/form-data">
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
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Logo</label>
                      <div className="input-group mb-3">
                        <input
                          type="file"
                          className="form-control"
                          id="logoFile"
                          name="logo"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </div>
                      {logoPreview && (
                        <div className="mt-2 position-relative">
                          <small className="text-muted">Logo preview:</small>
                          <div className="mt-1 p-2 border rounded position-relative" style={{ maxWidth: '150px' }}>
                            <img 
                              src={logoPreview} 
                              alt="Logo Preview" 
                              className="img-fluid"
                              onError={(e) => {
                                console.error("Logo image failed to load:", e);
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-logo.png';
                              }}
                            />
                            <button 
                              type="button"
                              className="btn btn-sm btn-danger position-absolute"
                              style={{ top: '5px', right: '5px' }}
                              onClick={handleDeleteLogo}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      )}
                      <small className="text-muted mt-1 d-block">
                        Supported formats: JPG, PNG, GIF. Max size: 10MB
                      </small>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-bold">Banner</label>
                      <div className="input-group mb-3">
                        <input
                          type="file"
                          className="form-control"
                          id="bannerFile"
                          name="banner"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </div>
                      {bannerPreview && (
                        <div className="mt-2 position-relative">
                          <small className="text-muted">Banner preview:</small>
                          <div className="mt-1 p-2 border rounded position-relative">
                            <img 
                              src={bannerPreview} 
                              alt="Banner Preview" 
                              className="img-fluid"
                              style={{ maxHeight: '100px' }}
                              onError={(e) => {
                                console.error("Banner image failed to load:", e);
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-banner.jpg';
                              }}
                            />
                            <button 
                              type="button"
                              className="btn btn-sm btn-danger position-absolute"
                              style={{ top: '5px', right: '5px' }}
                              onClick={handleDeleteBanner}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      )}
                      <small className="text-muted mt-1 d-block">
                        Supported formats: JPG, PNG, GIF. Max size: 10MB
                      </small>
                    </div>
                  </div>
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
                
                <div className="d-flex justify-content-end mt-4">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-2" 
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
      </div>
    </div>
  );
};

export default EditStartupModal; 