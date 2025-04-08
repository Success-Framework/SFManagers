import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

interface Skill {
  id: string;
  name: string;
}

interface EditSkillsModalProps {
  show: boolean;
  onHide: () => void;
  skills: Skill[];
  onSkillsUpdated: () => void;
}

const EditSkillsModal: React.FC<EditSkillsModalProps> = ({ 
  show, 
  onHide, 
  skills, 
  onSkillsUpdated 
}) => {
  const { token } = useAuth();
  const [skillsInput, setSkillsInput] = useState<string>(
    skills.map(skill => skill.name).join(', ')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSkillsInput(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Parse skills from comma-separated input
      const skillsArray = skillsInput
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      // Remove duplicates
      const uniqueSkills = Array.from(new Set(skillsArray));
      
      const response = await fetch('/api/users/profile/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          skills: uniqueSkills
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update skills');
      }
      
      onSkillsUpdated();
      onHide();
    } catch (err) {
      console.error('Error updating skills:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Skills</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formSkills">
            <Form.Label>Skills (comma-separated)</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={skillsInput}
              onChange={handleSkillsChange}
              placeholder="JavaScript, React, Node.js, etc."
            />
            <Form.Text className="text-muted">
              Enter your skills separated by commas.
            </Form.Text>
          </Form.Group>
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
          {isSubmitting ? 'Saving...' : 'Save Skills'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditSkillsModal; 