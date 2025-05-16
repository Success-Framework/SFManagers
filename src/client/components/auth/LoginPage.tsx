import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStartups, setHasStartups] = useState<boolean | null>(null);
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from location state, but don't default yet
  const fromPath = location.state?.from?.pathname;
  
  // Function to determine the redirect path
  const getRedirectPath = () => {
    // If the user was trying to access a specific page, send them there
    if (fromPath && fromPath !== '/' && fromPath !== '/login' && fromPath !== '/register') {
      return fromPath;
    }
    
    // Otherwise redirect based on whether they have startups
    return hasStartups ? '/my-startups' : '/browse-startups';
  };
  
  // Add and remove auth-page class to body
  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);
  
  // Set loading to false after the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if user has startups
  useEffect(() => {
    const checkUserStartups = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const response = await fetch('/api/startups/my-startups', {
          headers: { 'x-auth-token': localStorage.getItem('token') || '' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasStartups(data && data.length > 0);
        } else {
          setHasStartups(false);
        }
      } catch (error) {
        console.error('Error checking startups:', error);
        setHasStartups(false);
      }
    };
    
    if (isAuthenticated && user) {
      checkUserStartups();
    }
  }, [isAuthenticated, user]);
  
  // Handle authenticated users that somehow reach the login page
  useEffect(() => {
    // We shouldn't redirect during loading states
    if (isLoading) return;
    
    // Only perform a redirect if we have both:
    // 1. The user is authenticated according to context
    // 2. We actually have a token in localStorage
    const token = localStorage.getItem('token');
      
    if (token && isAuthenticated && !redirecting) {
      console.log('LoginPage: Already authenticated - checking startup status');
      
      // Set redirecting state to prevent multiple redirects
      setRedirecting(true);
      
      // If we're still loading startup data, wait briefly
      if (hasStartups === null) {
        setTimeout(() => {
          const redirectPath = getRedirectPath();
          console.log('LoginPage: Redirecting to', redirectPath);
          navigate(redirectPath, { replace: true });
        }, 300);
      } else {
        // We know if they have startups, redirect immediately
        const redirectPath = getRedirectPath();
        console.log('LoginPage: Redirecting to', redirectPath);
        
        // Use setTimeout to avoid immediate navigation which can cause React errors
        const timer = setTimeout(() => {
          // Use replace to avoid breaking back button
          navigate(redirectPath, { replace: true });
        }, 100);  // Longer delay to ensure component is fully mounted
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, redirecting, isLoading, navigate, hasStartups]);
  
  // If already authenticated and redirecting, show a spinner
  if (redirecting) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Redirecting...</span>
        </div>
      </div>
    );
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      // Login successful, check user's startups before navigation
      setRedirecting(true);
      try {
        const response = await fetch('/api/startups/my-startups', {
          headers: { 'x-auth-token': localStorage.getItem('token') || '' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const hasUserStartups = data && data.length > 0;
          setHasStartups(hasUserStartups);
          
          // Navigate based on startups
          const redirectPath = hasUserStartups ? '/my-startups' : '/browse-startups';
          navigate(redirectPath, { replace: true });
        } else {
          // Default to browse-startups on error
          navigate('/browse-startups', { replace: true });
        }
      } catch (error) {
        console.error('Error checking startups after login:', error);
        // Default to browse-startups on error
        navigate('/browse-startups', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error in component:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      setIsSubmitting(false);
      setRedirecting(false);
    }
  };
  
  // Extracted into a separate function to avoid React warnings about hooks in conditions
  const renderLoginForm = () => {
    return (
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
    );
  };
  
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ 
      background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)'
    }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="text-center mb-4">
              <h1 className="display-4 fw-bold text-white">SFManagers</h1>
              <p className="lead text-white opacity-75">Connect with innovative startups and entrepreneurs</p>
            </div>
            
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold">Welcome Back</h3>
                  <p className="text-muted">Sign in to your account to continue</p>
                </div>
                
                {error && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                  </div>
                )}
                
                {renderLoginForm()}
                
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