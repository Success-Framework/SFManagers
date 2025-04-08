import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
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
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      console.error('Login error in component:', err);
      // The auth context will set authError, but we can also set formError for more specific messages
      if (err.message) {
        setFormError(err.message);
      } else {
        setFormError('Login failed. Please check your credentials and try again.');
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
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="text-center mb-4">
              <h1 className="display-4 fw-bold text-white">SFManager</h1>
              <p className="lead text-white opacity-75">Connect with innovative startups and entrepreneurs</p>
            </div>
            
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold">Welcome Back</h3>
                  <p className="text-muted">Sign in to your account to continue</p>
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
                  </div>
                  
                  <div className="form-floating mb-4">
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
                          Logging in...
                        </>
                      ) : 'Sign In'}
                    </button>
                  </div>
                </form>
                
                <div className="text-center mt-4">
                  <p className="mb-0">
                    Don't have an account? <Link to="/register" className="text-decoration-none fw-bold">Create one now</Link>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-white opacity-75 small mb-0">
                © {new Date().getFullYear()} SFManager. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 