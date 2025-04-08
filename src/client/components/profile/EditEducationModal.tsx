import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Education } from '../../types';

interface EditEducationModalProps {
  show: boolean;
  onHide: () => void;
  education: Education | null;
  onEducationUpdated: () => void;
}

const EditEducationModal: React.FC<EditEducationModalProps> = ({
  show,
  onHide,
  education,
  onEducationUpdated
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    school: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when modal opens or education changes
  useEffect(() => {
    if (education) {
      // Format dates for input fields
      const startDate = education.startDate ? new Date(education.startDate).toISOString().split('T')[0] : '';
      const endDate = education.endDate ? new Date(education.endDate).toISOString().split('T')[0] : '';
      
      setFormData({
        school: education.school,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        startDate,
        endDate,
        description: education.description || ''
      });
    } else {
      // Reset form for new education
      setFormData({
        school: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        description: ''
      });
    }
    setError(null);
  }, [education, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.school || !formData.degree || !formData.fieldOfStudy || !formData.startDate) {
        throw new Error('Please fill in all required fields');
      }

      const url = education?.id
        ? `/api/users/profile/education/${education.id}`
        : '/api/users/profile/education';
      
      const method = education?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${education?.id ? 'update' : 'add'} education`);
      }

      onEducationUpdated();
      onHide();
    } catch (err) {
      console.error('Error submitting education:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!education?.id) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/profile/education/${education.id}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete education');
      }
      
      onEducationUpdated();
      onHide();
    } catch (err) {
      console.error('Error deleting education:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{education?.id ? 'Edit Education' : 'Add Education'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formSchool">
            <Form.Label>School/University*</Form.Label>
            <Form.Control
              type="text"
              name="school"
              value={formData.school}
              onChange={handleChange}
              placeholder="Enter school name"
              required
            />
          </Form.Group>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formDegree">
                <Form.Label>Degree*</Form.Label>
                <Form.Control
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  placeholder="e.g. Bachelor's"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formFieldOfStudy">
                <Form.Label>Field of Study*</Form.Label>
                <Form.Control
                  type="text"
                  name="fieldOfStudy"
                  value={formData.fieldOfStudy}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
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
                <Form.Label>End Date (or expected)</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
                <Form.Text className="text-muted">
                  Leave blank if currently studying
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe achievements, activities, etc."
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <div>
          {education?.id && (
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
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditEducationModal; 