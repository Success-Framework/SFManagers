import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Add and remove auth-page class to body
  useEffect(() => {
    document.body.classList.add('auth-page');
    
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      await register(name, email, password);
      navigate('/home');
    } catch (err: any) {
      console.error('Registration error in component:', err);
      // The auth context will set authError, but we can also set formError for more specific messages
      if (err.message) {
        setFormError(err.message);
      } else {
        setFormError('Registration failed. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ 
      background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 col-sm-10">
            <div className="text-center mb-4">
              <h1 className="display-4 fw-bold text-white">Startup Connect</h1>
              <p className="lead text-white opacity-75">Join our community of entrepreneurs and innovators</p>
            </div>
            
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold">Create Your Account</h3>
                  <p className="text-muted">Join our platform to connect with startups and founders</p>
                </div>
                
                {formError && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{formError}</div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    <label htmlFor="name">Full Name</label>
                  </div>
                  
                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    <label htmlFor="email">Email address</label>
                    <div className="form-text small">We'll never share your email with anyone else.</div>
                  </div>
                  
                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    <label htmlFor="password">Password</label>
                    <div className="form-text small">Must be at least 6 characters long.</div>
                  </div>
                  
                  <div className="form-floating mb-4">
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                    <label htmlFor="confirmPassword">Confirm Password</label>
                  </div>
                  
                  <div className="d-grid">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg py-3"
                      disabled={isSubmitting}
                      style={{ background: 'linear-gradient(to right, #6a11cb, #2575fc)', borderColor: 'transparent' }}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating Account...
                        </>
                      ) : 'Create Account'}
                    </button>
                  </div>
                </form>
                
                <div className="text-center mt-4">
                  <p className="mb-0">
                    Already have an account? <Link to="/login" className="text-decoration-none fw-bold">Sign in now</Link>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-white opacity-75 small mb-0">
                © {new Date().getFullYear()} Startup Connect. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 