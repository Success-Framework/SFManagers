import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Experience } from '../../types';

interface EditExperienceModalProps {
  show: boolean;
  onHide: () => void;
  experience: Experience | null;
  onExperienceUpdated: () => void;
}

const EditExperienceModal: React.FC<EditExperienceModalProps> = ({
  show,
  onHide,
  experience,
  onExperienceUpdated
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    position: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when modal opens or experience changes
  useEffect(() => {
    if (experience) {
      // Format dates for input fields
      const startDate = experience.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : '';
      const endDate = experience.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : '';
      
      setFormData({
        title: experience.title,
        company: experience.company,
        location: experience.location || '',
        startDate,
        endDate,
        current: experience.current,
        description: experience.description || '',
        position: experience.title
      });
    } else {
      // Reset form for new experience
      setFormData({
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        position: ''
      });
    }
    setError(null);
  }, [experience, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    // Special case: when title changes, also update position
    if (name === 'title') {
      setFormData(prev => ({
        ...prev,
        title: value,
        position: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle current checkbox change
  const handleCurrentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      current: checked,
      // Clear end date if current is checked
      endDate: checked ? '' : prev.endDate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.company || !formData.startDate) {
        throw new Error('Please fill in all required fields');
      }

      const url = experience?.id
        ? `/api/users/profile/experience/${experience.id}`
        : '/api/users/profile/experience';
      
      const method = experience?.id ? 'PUT' : 'POST';
      
      // IMPORTANT: Only include fields that exist in the database schema
      // The database Experience model has: position (not title), company, description, startDate, endDate
      // It does NOT have: location, current
      const payload = {
        title: formData.title, // This will be mapped to 'position' on the backend
        company: formData.company,
        description: formData.description || 'No description provided',
        startDate: formData.startDate,
        endDate: formData.current ? null : formData.endDate || null,
        current: Boolean(formData.current)
        // Deliberately NOT including location since it's not in the database schema
      };

      console.log('Submitting experience with payload:', payload);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('Server response:', response.status, responseText);

      if (!response.ok) {
        throw new Error(responseText || 'Failed to save experience');
      }

      onExperienceUpdated();
      onHide();
    } catch (err) {
      console.error('Error submitting experience:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!experience?.id) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/profile/experience/${experience.id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token || ''
        }
      });
      
      if (!response.ok) {
        const responseData = await response.text();
        let errorMessage = 'Failed to delete experience';
        try {
          const errorJson = JSON.parse(responseData);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          if (responseData) errorMessage = responseData;
        }
        throw new Error(errorMessage);
      }
      
      onExperienceUpdated();
      onHide();
    } catch (err) {
      console.error('Error deleting experience:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{experience?.id ? 'Edit Experience' : 'Add Experience'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formTitle">
            <Form.Label>Title*</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Software Developer"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="formCompany">
            <Form.Label>Company*</Form.Label>
            <Form.Control
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company name"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="formLocation">
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. New York, NY"
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="formCurrent">
            <Form.Check
              type="checkbox"
              label="I currently work here"
              name="current"
              checked={formData.current}
              onChange={handleCurrentChange}
            />
          </Form.Group>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formStartDate">
                <Form.Label>Start Date*</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formEndDate">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  disabled={formData.current}
                />
                {formData.current && (
                  <Form.Text className="text-muted">
                    End date not required for current positions
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your responsibilities, achievements, and the technologies you worked with"
            />
          </Form.Group>
          
          <Modal.Footer className="d-flex justify-content-between">
            <div>
              {experience?.id && (
                <Button 
                  variant="danger" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
            <div>
              <Button variant="secondary" onClick={onHide} className="me-2">
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditExperienceModal; 