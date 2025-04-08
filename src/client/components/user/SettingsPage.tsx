import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { SketchPicker } from 'react-color';

const SettingsPage: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const { theme, customTheme, setTheme, setCustomTheme } = useTheme();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [colorPickerProperty, setColorPickerProperty] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset message
    setMessage({ type: '', text: '' });
    
    // Validate form
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'danger', text: 'New passwords do not match' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'Password must be at least 6 characters long' });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Show success message
      setMessage({ type: 'success', text: 'Password changed successfully' });
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (selectedTheme: string) => {
    setTheme(selectedTheme as 'light' | 'dark' | 'custom');
  };

  const handleColorChange = (color: { hex: string }, property: string) => {
    setCustomTheme({
      ...customTheme,
      [property]: color.hex
    });
  };
  
  // If user is not loaded yet, show loading
  if (!user) {
    return <div className="text-center p-5">Loading...</div>;
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Settings</h1>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'account')}
            className="mb-4"
          >
            <Tab eventKey="account" title="Account Settings">
              <Card>
                <Card.Header>Change Password</Card.Header>
                <Card.Body>
                  {message.text && (
                    <Alert variant={message.type}>{message.text}</Alert>
                  )}
                  
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="appearance" title="Appearance">
              <Card>
                <Card.Header>Theme Settings</Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Group className="mb-4">
                      <Form.Label>Select Theme</Form.Label>
                      <div>
                        <Form.Check
                          type="radio"
                          label="Light"
                          name="theme"
                          id="theme-light"
                          checked={theme === 'light'}
                          onChange={() => handleThemeChange('light')}
                          className="mb-2"
                        />
                        <Form.Check
                          type="radio"
                          label="Dark"
                          name="theme"
                          id="theme-dark"
                          checked={theme === 'dark'}
                          onChange={() => handleThemeChange('dark')}
                          className="mb-2"
                        />
                        <Form.Check
                          type="radio"
                          label="Custom"
                          name="theme"
                          id="theme-custom"
                          checked={theme === 'custom'}
                          onChange={() => handleThemeChange('custom')}
                        />
                      </div>
                    </Form.Group>
                    
                    {theme === 'custom' && (
                      <div className="custom-theme-settings mt-4">
                        <h5>Custom Theme Settings</h5>
                        
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Primary Color</Form.Label>
                              <div 
                                className="color-preview mb-2" 
                                style={{ 
                                  backgroundColor: customTheme.primaryColor,
                                  width: '100%',
                                  height: '40px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: '1px solid #ced4da'
                                }}
                                onClick={() => setColorPickerProperty('primaryColor')}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Secondary Color</Form.Label>
                              <div 
                                className="color-preview mb-2" 
                                style={{ 
                                  backgroundColor: customTheme.secondaryColor,
                                  width: '100%',
                                  height: '40px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: '1px solid #ced4da'
                                }}
                                onClick={() => setColorPickerProperty('secondaryColor')}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Background Color</Form.Label>
                              <div 
                                className="color-preview mb-2" 
                                style={{ 
                                  backgroundColor: customTheme.backgroundColor,
                                  width: '100%',
                                  height: '40px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: '1px solid #ced4da'
                                }}
                                onClick={() => setColorPickerProperty('backgroundColor')}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Text Color</Form.Label>
                              <div 
                                className="color-preview mb-2" 
                                style={{ 
                                  backgroundColor: customTheme.textColor,
                                  width: '100%',
                                  height: '40px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: '1px solid #ced4da'
                                }}
                                onClick={() => setColorPickerProperty('textColor')}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>Accent Color</Form.Label>
                              <div 
                                className="color-preview mb-2" 
                                style={{ 
                                  backgroundColor: customTheme.accentColor,
                                  width: '100%',
                                  height: '40px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: '1px solid #ced4da'
                                }}
                                onClick={() => setColorPickerProperty('accentColor')}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        {colorPickerProperty && (
                          <div className="color-picker-container mt-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6>Edit {colorPickerProperty.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h6>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => setColorPickerProperty(null)}
                              >
                                Close
                              </Button>
                            </div>
                            <SketchPicker 
                              color={customTheme[colorPickerProperty as keyof typeof customTheme]} 
                              onChange={(color) => handleColorChange(color, colorPickerProperty)}
                              width="100%"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default SettingsPage; 