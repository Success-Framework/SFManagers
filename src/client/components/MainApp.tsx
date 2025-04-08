import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './common/Navbar';
import StartupForm from './StartupForm';
import JoinStartupPage from './startup/JoinStartupPage';
import MyJoinRequestsPage from './join-request/MyJoinRequestsPage';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import BrowseStartupsPage from './startup/BrowseStartupsPage';
import StartupDetailPage from './startup/StartupDetailPage';
import ManageStartupRequestsPage from './startup/ManageStartupRequestsPage';
import MyStartupsPage from './user/MyStartupsPage';
import TaskManagementPage from './task/TaskManagementPage';
import UserDashboard from './dashboard/UserDashboard';
import SettingsPage from './user/SettingsPage';
import ProfilePage from './profile/ProfilePage';
import AnalyticsPage from './analytics/AnalyticsPage';
import LeadsPage from './leads/LeadsPage';
import AffiliateTracker from './affiliate/AffiliateTracker';
import ToastNotifications from './common/ToastNotifications';

// Regular loading spinner for in-page loading states
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center mt-5">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <div className="ms-2">Loading...</div>
  </div>
);

// Landing page that redirects based on authentication status
const LandingPage = () => {
  const { token } = useAuth();
  console.log('LandingPage: token present =', !!token);
  return token ? <Navigate to="/my-startups" /> : <Navigate to="/login" />;
};

const CreateStartupPage = () => {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <h2 className="text-center mb-4">Register Your Startup</h2>
          <StartupForm onStartupAdded={() => {}} />
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token, isLoading, isAuthenticated, isFirstLogin, isPageRefresh, user, markUserAsRegistered } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Handle welcome notifications
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      // Check if we should show welcome notification
      if (isFirstLogin && !isPageRefresh) {
        // Show welcome notification for first time users
        toast.success(`Welcome to SFManager, ${user.name}! We're excited to have you join us.`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Mark this user as having seen the welcome notification
        markUserAsRegistered(user.id);
      } else if (!isPageRefresh && !isFirstLogin) {
        // Show a simple welcome back toast for returning users (not on page refresh)
        toast.info(`Welcome back, ${user.name}!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: true,
        });
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
          <p className="mt-3 text-muted">Loading SFManager...</p>
        </div>
      </div>
    );
  }
  
  // Render the application once authentication is resolved
  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} />
      <AffiliateTracker />
      <ToastContainer />
      <ToastNotifications />
      <div className="d-flex">
        <div className="main-content" style={{ 
          width: '100%',
          transition: 'margin-left 0.3s ease, width 0.3s ease',
          marginTop: '56px', // Adjust for navbar
          padding: '20px'
        }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Navigate to="/my-startups" />} />
            <Route path="/create-startup" element={token ? <CreateStartupPage /> : <Navigate to="/login" />} />
            <Route path="/browse-startups" element={token ? <BrowseStartupsPage /> : <Navigate to="/login" />} />
            <Route path="/startup/:startupId" element={token ? <StartupDetailPage /> : <Navigate to="/login" />} />
            <Route path="/join-startup" element={token ? <JoinStartupPage /> : <Navigate to="/login" />} />
            <Route path="/my-requests" element={token ? <MyJoinRequestsPage /> : <Navigate to="/login" />} />
            <Route path="/my-startups" element={token ? <MyStartupsPage /> : <Navigate to="/login" />} />
            <Route path="/my-dashboard" element={token ? <UserDashboard /> : <Navigate to="/login" />} />
            <Route path="/startup/:startupId/requests" element={token ? <ManageStartupRequestsPage /> : <Navigate to="/login" />} />
            <Route path="/startup/:startupId/dashboard" element={token ? <TaskManagementPage /> : <Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/settings" element={token ? <SettingsPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={token ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={token ? <AnalyticsPage /> : <Navigate to="/login" />} />
            <Route path="/leads" element={token ? <LeadsPage /> : <Navigate to="/login" />} />
            <Route path="/startup/:startupId/leads" element={token ? <LeadsPage /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default MainApp; 