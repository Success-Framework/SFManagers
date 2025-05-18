import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './common/Navbar';
import ToastNotifications from './common/ToastNotifications';
import EditStartupPage from './startup/EditStartupPage';
import ManageRolesPage from './startup/ManageRolesPage';
import ManageMembersPage from './startup/ManageMembersPage';
import AffiliateLinksPage from './affiliate/AffiliateLinksPage';
import AffiliateRedirect from './affiliate/AffiliateRedirect';

// Regular loading spinner for in-page loading states
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center mt-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <div className="ms-2">Loading...</div>
  </div>
);

// Lazy loaded components to improve initial load time
const StartupForm = lazy(() => import('./StartupForm'));
const JoinStartupPage = lazy(() => import('./startup/JoinStartupPage'));
const MyJoinRequestsPage = lazy(() => import('./join-request/MyJoinRequestsPage'));
const LoginPage = lazy(() => import('./auth/LoginPage'));
const RegisterPage = lazy(() => import('./auth/RegisterPage'));
const BrowseStartupsPage = lazy(() => import('./startup/BrowseStartupsPage'));
const StartupDetailPage = lazy(() => import('./startup/StartupDetailPage'));
const ManageStartupRequestsPage = lazy(() => import('./startup/ManageStartupRequestsPage'));
const MyStartupsPage = lazy(() => import('./user/MyStartupsPage'));
const TaskManagementPage = lazy(() => import('./task/TaskManagementPage'));
const FreelanceTaskList = lazy(() => import('./task/FreelanceTaskList'));
const UserDashboard = lazy(() => import('./dashboard/UserDashboard'));
const SettingsPage = lazy(() => import('./user/SettingsPage'));
const ProfilePage = lazy(() => import('./profile/ProfilePage'));
const AnalyticsPage = lazy(() => import('./analytics/AnalyticsPage'));
const LeadsPage = lazy(() => import('./leads/LeadsPage'));
const MessagingHome = lazy(() => import('./messaging/MessagingHome'));
const SentMessages = lazy(() => import('./messaging/SentMessages'));
const Conversation = lazy(() => import('./messaging/Conversation'));
const ComposeMessage = lazy(() => import('./messaging/ComposeMessage'));
const MessageDebug = lazy(() => import('./messaging/MessageDebug'));
const UserSearch = lazy(() => import('./messaging/UserSearch'));
const UserProfile = lazy(() => import('./messaging/UserProfile'));
const Profiles = lazy(() => import('../pages/Profiles'));
const GroupChat = lazy(() => import('./messaging/GroupChat'));

// Landing page that redirects based on authentication status
const LandingPage = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Only navigate after authentication state is determined
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, go to login
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 100);
        return;
      }
      
      // User is authenticated, check if they have startups
      const checkUserStartups = async () => {
        try {
          const response = await fetch('/api/startups/my-startups', {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' }
          });
          
          // Always redirect to dashboard, which now contains startups
          setTimeout(() => {
            navigate('/my-dashboard', { replace: true });
            setChecking(false);
          }, 100);
        } catch (error) {
          console.error('Error checking startups:', error);
          // Error, redirect to dashboard
          setTimeout(() => {
            navigate('/my-dashboard', { replace: true });
            setChecking(false);
          }, 100);
        }
      };
      
      checkUserStartups();
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Always render a loading indicator while determining auth state
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Preparing SFManagers{checking ? "..." : ""}</p>
      </div>
    </div>
  );
};

const CreateStartupPage = () => {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <h2 className="text-center mb-4">Register Your Startup</h2>
          <Suspense fallback={<LoadingSpinner />}>
            <StartupForm onStartupAdded={() => {}} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

// Protected route component to handle authentication checks consistently
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle the authentication check with a useEffect to avoid render-time navigation
  useEffect(() => {
    // Special handling for affiliate analytics routes
    const isAffiliateRoute = location.pathname.includes('/affiliate-analytics');
    
    if (!isLoading) {
      if (!isAuthenticated || !token) {
        if (isAffiliateRoute) {
          // For affiliate routes, store the intended destination
          localStorage.setItem('redirectAfterLogin', location.pathname);
        }
        // Use setTimeout to prevent render-time navigation errors
        setTimeout(() => {
          navigate('/login', { state: { from: location }, replace: true });
        }, 50);
      } else if (isAuthenticated && localStorage.getItem('redirectAfterLogin')) {
        // Handle redirect after successful login for affiliate routes
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        localStorage.removeItem('redirectAfterLogin');
        if (redirectPath) {
          navigate(redirectPath, { replace: true });
        }
      }
    }
  }, [isLoading, isAuthenticated, token, location, navigate]);
  
  // Still loading auth state - show loading spinner
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Show loading while we prepare to redirect (prevents flash of content)
  if (!isAuthenticated || !token) {
    return <LoadingSpinner />;
  }
  
  // Is authenticated - render the children
  return <>{children}</>;
};

// Define proper types for the ComponentErrorBoundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple component-level error boundary to gracefully handle rendering errors
class ComponentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Component error caught:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-4">
          <h4 className="alert-heading">Something went wrong</h4>
          <p>There was an error loading this component. The application is still functional.</p>
          <hr />
          <div className="d-flex justify-content-between">
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => window.location.href = '/my-dashboard'}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

const MainApp: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const { token, isLoading, isAuthenticated, isFirstLogin, isPageRefresh, user, markUserAsRegistered } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Add a ref to track if welcome notification was shown in this session
  const welcomeNotificationShownRef = useRef(false);
  
  // Add check for Redux store availability
  const [reduxReady, setReduxReady] = useState<boolean>(false);
  
  // Check if there's a stored initial route from direct URL access
  useEffect(() => {
    const initialRoute = localStorage.getItem('initial_route');
    if (initialRoute) {
      console.log('Found initial route:', initialRoute);
      // Remove the initial route from storage so it doesn't persist
      localStorage.removeItem('initial_route');
      
      // Only navigate if it's not already the current path
      if (location.pathname !== initialRoute) {
        console.log('Navigating to initial route:', initialRoute);
        navigate(initialRoute, { replace: true });
      }
    }
    
    // Check if there's a data-initial-path attribute on the root element
    const rootElem = document.getElementById('root');
    if (rootElem && rootElem.getAttribute('data-initial-path')) {
      const initialPath = rootElem.getAttribute('data-initial-path');
      console.log('Found initial path attribute:', initialPath);
      
      // Clear the attribute so it doesn't persist
      rootElem.removeAttribute('data-initial-path');
      
      // Only navigate if it's not already the current path
      if (initialPath && location.pathname !== initialPath) {
        console.log('Navigating to initial path:', initialPath);
        navigate(initialPath, { replace: true });
      }
    }
  }, [navigate, location.pathname]);
  
  // Check if Redux store is ready
  useEffect(() => {
    try {
      // Try to access Redux store through window to check if it's initialized
      if (window && (window as any).__REDUX_STORE_READY__) {
        setReduxReady(true);
      } else {
        // Set a flag in window to indicate Redux store is ready
        (window as any).__REDUX_STORE_READY__ = true;
        // Wait a short period to ensure Redux is fully initialized
        setTimeout(() => {
          setReduxReady(true);
        }, 200);
      }
    } catch (err) {
      console.error('Error checking Redux store:', err);
    }
  }, []);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Effect to handle route transitions
  useEffect(() => {
    setRouteTransitioning(true);
    const timer = setTimeout(() => {
      setRouteTransitioning(false);
    }, 300); // Short delay to ensure smooth transitions
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  // Force navigate to login if not authenticated, ensure we only do this once per page load
  useEffect(() => {
    // Skip any redirects during loading state
    if (isLoading) return;
    
    // Get paths that don't require authentication
    const publicPaths = [
      '/login',
      '/register',
      '/affiliate/',
      '/startup/'
    ];
    const isPublicPath = publicPaths.some(path => location.pathname.includes(path));
    
    // Only redirect non-public paths when definitely not authenticated
    if (!isAuthenticated && !isPublicPath) {
      console.log('MainApp: User not authenticated, redirecting to login');
      
      // Use a ref to track if we've dispatched a navigation
      const navigationTimer = setTimeout(() => {
        // Use replace to prevent history buildup
        navigate('/login', { replace: true });
      }, 100);
      
      return () => clearTimeout(navigationTimer);
    }
  }, [isLoading, isAuthenticated, navigate, location.pathname]);
  
  // Handle welcome notifications
  useEffect(() => {
    // First check if we've already shown notifications in this session
    const notificationShownInSession = sessionStorage.getItem('welcomeNotificationShown');
    
    if (isAuthenticated && user && !isLoading && !welcomeNotificationShownRef.current && !notificationShownInSession) {
      // Check if we should show welcome notification
      if (isFirstLogin && !isPageRefresh) {
        // Show welcome notification for first time users
        toast.success(`Welcome to SFManagers, ${user.name}! We're excited to have you join us.`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Mark this user as having seen the welcome notification
        markUserAsRegistered(user.id);
        // Set flag to prevent duplicate notifications
        welcomeNotificationShownRef.current = true;
        // Store in sessionStorage to persist across navigation 
        sessionStorage.setItem('welcomeNotificationShown', 'true');
      } else if (!isPageRefresh && !isFirstLogin) {
        // Show a simple welcome back toast for returning users (not on page refresh)
        toast.info(`Welcome back, ${user.name}!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        });
        // Set flag to prevent duplicate notifications
        welcomeNotificationShownRef.current = true;
        // Store in sessionStorage to persist across navigation
        sessionStorage.setItem('welcomeNotificationShown', 'true');
      }
    }
  }, [isAuthenticated, isFirstLogin, isPageRefresh, user, markUserAsRegistered, isLoading]);
  
  // Show loading spinner only when authentication is actively in progress
  if (isLoading) {
    return (
      <div className="main-loader d-flex align-items-center justify-content-center" 
           style={{ 
             position: 'fixed',
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             background: '#f8f9fa',
             zIndex: 9999
           }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading SFManagers...</p>
        </div>
      </div>
    );
  }
  
  // Render the application once authentication is resolved
  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} />
      <ToastContainer />
      <ToastNotifications />
      <div className="d-flex">
        <div className={`main-content ${routeTransitioning ? 'route-transitioning' : ''}`} style={{ 
          width: '100%',
          transition: 'margin-left 0.3s ease, width 0.3s ease, opacity 0.3s ease',
          marginTop: '56px', // Adjust for navbar
          padding: '20px'
        }}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Navigate to="/my-startups" replace />} />
              
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/affiliate/:code" element={<AffiliateRedirect />} />
              <Route path="/startup/:startupId/affiliate/:code" element={<AffiliateRedirect />} />
              
              {/* Protected routes */}
              <Route path="/create-startup" element={
                <ProtectedRoute>
                  <ComponentErrorBoundary>
                    <CreateStartupPage />
                  </ComponentErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/browse-startups" element={
                <ProtectedRoute>
                  <BrowseStartupsPage />
                </ProtectedRoute>
              } />
              <Route path="/profiles" element={
                <ProtectedRoute>
                  <Profiles />
                </ProtectedRoute>
              } />
              <Route path="/profiles/:id" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId" element={
                <ProtectedRoute>
                  <StartupDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/edit" element={
                <ProtectedRoute>
                  <EditStartupPage />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/roles" element={
                <ProtectedRoute>
                  <ManageRolesPage />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/members" element={
                <ProtectedRoute>
                  <ManageMembersPage />
                </ProtectedRoute>
              } />
              <Route path="/join-startup" element={
                <ProtectedRoute>
                  <JoinStartupPage />
                </ProtectedRoute>
              } />
              <Route path="/my-requests" element={
                <ProtectedRoute>
                  <MyJoinRequestsPage />
                </ProtectedRoute>
              } />
              <Route path="/my-startups" element={
                <ProtectedRoute>
                  <MyStartupsPage />
                </ProtectedRoute>
              } />
              <Route path="/my-dashboard" element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/freelance" element={
                <ProtectedRoute>
                  <FreelanceTaskList />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/requests" element={
                <ProtectedRoute>
                  <ManageStartupRequestsPage />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/tasks" element={
                <ProtectedRoute>
                  <ComponentErrorBoundary>
                    <TaskManagementPage />
                  </ComponentErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/analytics" element={
                <ProtectedRoute>
                  <TaskManagementPage initialTab="analytics" />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/meetings" element={
                <ProtectedRoute>
                  <TaskManagementPage initialTab="meetings" />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/opportunities" element={
                <ProtectedRoute>
                  <TaskManagementPage initialTab="opportunities" />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/affiliate-analytics" element={
                <ProtectedRoute>
                  <TaskManagementPage initialTab="affiliate" />
                </ProtectedRoute>
              } />
              <Route path="/startup/:startupId/leads" element={
                <ProtectedRoute>
                  <TaskManagementPage initialTab="leads" />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute>
                  <LeadsPage />
                </ProtectedRoute>
              } />
              <Route path="/affiliate-links" element={
                <ProtectedRoute>
                  <ComponentErrorBoundary>
                    <AffiliateLinksPage />
                  </ComponentErrorBoundary>
                </ProtectedRoute>
              } />
              
              {/* Messaging Routes */}
              <Route path="/group-chat" element={
                <ProtectedRoute>
                  <GroupChat />
                </ProtectedRoute>
              } />
              
              {/* Catch all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default MainApp; 