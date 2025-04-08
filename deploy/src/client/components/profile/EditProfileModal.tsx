import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

interface EditProfileModalProps {
  show: boolean;
  onHide: () => void;
  profileData: any;
  onProfileUpdated: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  show, 
  onHide, 
  profileData, 
  onProfileUpdated 
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    headline: profileData?.headline || '',
    bio: profileData?.bio || '',
    location: profileData?.location || '',
    linkedinUrl: profileData?.linkedinUrl || '',
    githubUrl: profileData?.githubUrl || '',
    portfolio: profileData?.portfolio || '',
    phone: profileData?.phone || ''
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(
    profileData?.profileImage || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Append image if selected
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'x-auth-token': token || ''
        },
        body: formDataToSend
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      onProfileUpdated();
      onHide();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <Form.Group controlId="formName" className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </Form.Group>
              
              <Form.Group controlId="formHeadline" className="mb-3">
                <Form.Label>Headline</Form.Label>
                <Form.Control
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={handleChange}
                  placeholder="Professional headline (e.g., Full Stack Developer)"
                />
              </Form.Group>
              
              <Form.Group controlId="formLocation" className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </Form.Group>
              
              <Form.Group controlId="formPhone" className="mb-3">
                <Form.Label>Phone</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group controlId="formProfileImage" className="mb-3">
                <Form.Label>Profile Picture</Form.Label>
                <div className="mb-2">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile Preview"
                      className="img-thumbnail mb-2"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="img-thumbnail d-flex align-items-center justify-content-center bg-light text-muted" style={{ width: '150px', height: '150px' }}>
                      No Image
                    </div>
                  )}
                </div>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Form.Group>
            </div>
          </div>
          
          <Form.Group controlId="formBio" className="mb-3">
            <Form.Label>About</Form.Label>
            <Form.Control
              as="textarea"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell others about yourself, your experience, and what you're looking for"
            />
          </Form.Group>
          
          <div className="row">
            <div className="col-md-4">
              <Form.Group controlId="formLinkedIn" className="mb-3">
                <Form.Label>LinkedIn URL</Form.Label>
                <Form.Control
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </Form.Group>
            </div>
            
            <div className="col-md-4">
              <Form.Group controlId="formGithub" className="mb-3">
                <Form.Label>GitHub URL</Form.Label>
                <Form.Control
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                />
              </Form.Group>
            </div>
            
            <div className="col-md-4">
              <Form.Group controlId="formPortfolio" className="mb-3">
                <Form.Label>Portfolio Website</Form.Label>
                <Form.Control
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://myportfolio.com"
                />
              </Form.Group>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProfileModal; 