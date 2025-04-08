import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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

// Landing page that redirects based on authentication status
const LandingPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show a loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Redirect based on authentication status
  return isAuthenticated ? <Navigate to="/my-startups" /> : <Navigate to="/login" />;
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
  const { isAuthenticated, user } = useAuth();
  const { addNotification } = useNotifications();
  const [welcomeNotificationsSent, setWelcomeNotificationsSent] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Add a welcome notification when user logs in
  useEffect(() => {
    if (isAuthenticated && user && !welcomeNotificationsSent) {
      // Small delay to make it seem like it's loading
      const timer = setTimeout(() => {
        addNotification({
          title: 'Welcome back!',
          message: `Hi ${user.name || 'there'}, welcome to SFManager!`,
          type: 'info',
          link: '/my-dashboard'
        });
        
        // For demo purposes, add a few more notifications with different types
        addNotification({
          title: 'New join request',
          message: 'Someone requested to join your startup as a developer.',
          type: 'warning',
          link: '/my-requests'
        });
        
        addNotification({
          title: 'Achievement unlocked',
          message: 'You earned the "Early Adopter" badge.',
          type: 'success'
        });
        
        setWelcomeNotificationsSent(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, addNotification, welcomeNotificationsSent]);
  
  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} />
      <AffiliateTracker />
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
            <Route path="/create-startup" element={<CreateStartupPage />} />
            <Route path="/browse-startups" element={<BrowseStartupsPage />} />
            <Route path="/startup/:startupId" element={<StartupDetailPage />} />
            <Route path="/join-startup" element={<JoinStartupPage />} />
            <Route path="/my-requests" element={<MyJoinRequestsPage />} />
            <Route path="/my-startups" element={<MyStartupsPage />} />
            <Route path="/my-dashboard" element={<UserDashboard />} />
            <Route path="/startup/:startupId/requests" element={<ManageStartupRequestsPage />} />
            <Route path="/startup/:startupId/dashboard" element={<TaskManagementPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/startup/:startupId/leads" element={<LeadsPage />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default MainApp; 