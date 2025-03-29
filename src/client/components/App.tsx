import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import StartupForm from './StartupForm';
import StartupList from './StartupList';
import JoinStartupPage from './startup/JoinStartupPage';
import MyJoinRequestsPage from './join-request/MyJoinRequestsPage';
import ManageJoinRequestsPage from './join-request/ManageJoinRequestsPage';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import Navbar from './common/Navbar';
import { Startup } from '../types';
import BrowseStartupsPage from './startup/BrowseStartupsPage';
import StartupDetailPage from './startup/StartupDetailPage';
import ManageStartupRequestsPage from './startup/ManageStartupRequestsPage';
import MyStartupsPage from './user/MyStartupsPage';
import TaskManagementPage from './task/TaskManagementPage';

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
  return isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />;
};

const HomePage = () => {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <h1 className="text-center mb-4">Startup Registration Portal</h1>
          
          <div className="row mt-5">
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h3>Register a Startup</h3>
                  <p>Have an idea? Register your startup and find team members.</p>
                  <Link to="/create-startup" className="btn btn-primary">
                    Register Startup
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h3>Join a Startup</h3>
                  <p>Want to be part of something innovative? Join an existing startup.</p>
                  <Link to="/join-startup" className="btn btn-success">
                    Find Startups
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <StartupForm onStartupAdded={() => {}} />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container py-4">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/create-startup" element={<CreateStartupPage />} />
            <Route path="/browse-startups" element={<BrowseStartupsPage />} />
            <Route path="/startup/:startupId" element={<StartupDetailPage />} />
            <Route path="/join-startup" element={<JoinStartupPage />} />
            <Route path="/my-requests" element={<MyJoinRequestsPage />} />
            <Route path="/my-startups" element={<MyStartupsPage />} />
            <Route path="/startup/:startupId/requests" element={<ManageStartupRequestsPage />} />
            <Route path="/startup/:startupId/dashboard" element={<TaskManagementPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App; 