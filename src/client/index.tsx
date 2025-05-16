import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigationType, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import MainApp from './components/MainApp';
import './styles.css';
import './styles/theme.css';

// ScrollToTop component ensures the page scrolls to top on route changes
// And also handles browser history properly with enhanced back button support
const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  
  // Handle scrolling to top
  React.useEffect(() => {
    // Only auto-scroll to top on POP and PUSH navigation types
    // POP = back/forward button, PUSH = programmatic navigation
    // REPLACE = replace navigation which should maintain scroll
    if (navigationType !== 'REPLACE') {
      // Add a small delay to avoid potential React rendering issues
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 10);
    }
  }, [pathname, search, navigationType]);
  
  // Global handler for back button navigation
  React.useEffect(() => {
    // Only run this for back button navigation (POP)
    if (navigationType === 'POP') {
      try {
        // CRITICAL FIX: NEVER redirect anything with /tasks in the URL
        // This prevents the redirect loop with task paths
        if (pathname.includes('/tasks')) {
          console.log('Skipping redirect for tasks page:', pathname);
          // Store as valid immediately to prevent future redirects
          if (pathname.includes('/startup/')) {
            sessionStorage.setItem('lastValidLocation', pathname);
          }
          return;
        }
        
        // IMPORTANT FIX: Store the current path as valid immediately
        // This prevents redirect loops by considering the current path as valid
        // This is the most reliable way to handle back navigation
        if (pathname.includes('/startup/')) {
          const startupIdMatch = pathname.match(/\/startup\/([^\/]+)/);
          if (startupIdMatch) {
            // Store the current path as valid to prevent future redirects
            sessionStorage.setItem('lastValidLocation', pathname);
            console.log('Current path stored as valid:', pathname);
          }
        }

        // Get the last stored valid location, if any
        const lastValidLocation = sessionStorage.getItem('lastValidLocation');
        
        // Only redirect in very specific cases where we know the path is problematic
        if (lastValidLocation && pathname.includes('/startup/')) {
          const startupIdMatch = pathname.match(/\/startup\/([^\/]+)/);
          if (startupIdMatch) {
            const startupId = startupIdMatch[1];
            
            // VERY SPECIFIC checks only - Don't use general path validation
            const isDefinitelyInvalidPath = 
              pathname === `/startup/${startupId}/undefined` ||
              pathname === `/startup/${startupId}/null`;
            
            if (isDefinitelyInvalidPath) {
              console.log('Redirecting definitely invalid path:', pathname);
              navigate(`/startup/${startupId}`, { replace: true });
            }
          }
        }
      } catch (error) {
        // If something goes wrong with our back button handling, log it and take the user to a safe place
        console.error('Error in back button handling:', error);
        if (pathname.includes('/startup/')) {
          const startupIdMatch = pathname.match(/\/startup\/([^\/]+)/);
          if (startupIdMatch) {
            const startupId = startupIdMatch[1];
            // Navigate to a safe default page
            navigate(`/startup/${startupId}`, { replace: true });
          } else {
            // If we can't parse the startup ID, go to dashboard
            navigate('/my-dashboard', { replace: true });
          }
        }
      }
    }
  }, [pathname, navigationType, navigate]);
  
  return null;
};

// Define interfaces for ErrorBoundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// Error boundary to catch and gracefully handle React errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Specifically check for React error #310 (setState on unmounted component)
    const isError310 = error.message.includes('310') || 
                      (errorInfo.componentStack && errorInfo.componentStack.includes('Navbar'));
    
    // Check if this is an authentication error
    const isAuthError = 
      error.message.toLowerCase().includes("unauthorized") ||
      error.message.toLowerCase().includes("authentication") ||
      error.message.toLowerCase().includes("not logged in") ||
      error.message.toLowerCase().includes("authenticate") ||
      error.message.toLowerCase().includes("auth failed") ||
      error.message.toLowerCase().includes("token") ||
      (error.stack && error.stack.toLowerCase().includes("auth"));
    
    // For Error #310, just log it but don't reset app state
    if (isError310 && !isAuthError) {
      console.log("React Error #310 detected (setState on unmounted component). This is usually harmless.");
      // Just set a minimal error state
      this.setState({
        hasError: true,
        error,
        errorInfo,
      });
      // Force error recovery after a short delay
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 500);
      return;
    }
    
    // Handle authentication errors by explicitly clearing all auth-related data
    if (isAuthError) {
      console.log("Authentication error detected. Completely resetting auth state.");
      
      // Clear all auth-related storage
      localStorage.removeItem('token');
      localStorage.removeItem('cached_user_data');
      localStorage.removeItem('user_data_timestamp');
      localStorage.removeItem('user-registration-status');
      
      // Force a page reload to completely reset React's internal state
      // This is more reliable than trying to recover the app state
      setTimeout(() => {
        window.location.href = '/login?reset=true';
      }, 100);
    }
    
    // Always set error state
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // For error #310, we don't want to show the error page
      if (this.state.error && this.state.error.message && 
          this.state.error.message.includes('310')) {
        return this.props.children;
      }
      
      return (
        <div className="error-page">
          <div className="error-container">
            <h1>Something went wrong</h1>
            <p>We're sorry, but there was an error in the application.</p>
            <div className="error-actions">
              <button 
                onClick={() => {
                  // Safely refresh the page using setTimeout to avoid render-time issues
                  setTimeout(() => window.location.reload(), 50);
                }}
                className="btn btn-primary"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => {
                  // Safely navigate to login using setTimeout
                  setTimeout(() => {
                    window.location.href = '/login';
                  }, 50);
                }}
                className="btn btn-secondary ms-2"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <ReduxProvider store={store}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <NotificationProvider>
            <MessageProvider>
              <MainApp />
            </MessageProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ReduxProvider>
  </ErrorBoundary>
); 