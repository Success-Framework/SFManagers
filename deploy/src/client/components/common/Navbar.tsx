import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import RatingStars from './RatingStars';
import NotificationDropdown from './NotificationDropdown';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    // Apply theme class to the body element
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navbar on login or register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  // Get first character of user name for avatar
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    } else if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Calculate user rating based on their level or points
  const calculateUserRating = () => {
    if (!user) return 0;
    
    // Convert user level or points to a 5-star rating
    // For example, if max level is 100, then level 20 would be 1 star, level 40 would be 2 stars, etc.
    // Or use a formula based on points: min(5, points / 1000)
    
    // Using level-based calculation (assuming max level is around 50)
    const levelBasedRating = Math.min(5, (user.level || 1) / 10);
    
    // Using points-based calculation (assuming max points around 5000)
    const pointsBasedRating = Math.min(5, (user.points || 0) / 1000);
    
    // You can choose which calculation to use
    return levelBasedRating;
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <nav className="navbar navbar-gamified navbar-expand-lg fixed-top">
      <div className="container">
        {isAuthenticated && onToggleSidebar && (
          <button 
            className="btn btn-accent me-3 d-md-none" 
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list"></i>
          </button>
        )}
        <Link className="navbar-brand me-4" to={isAuthenticated ? "/my-startups" : "/login"}>
          <i className="bi bi-rocket-takeoff-fill me-2"></i>
          <span>SFManager</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuthenticated ? (
            <>
              <ul className="navbar-nav mx-auto">
                <li className="nav-item px-1">
                  <Link className={`nav-link ${location.pathname.includes('/my-startups') ? 'active' : ''}`} to="/my-startups">
                    <i className="bi bi-building me-2"></i>
                    <span>My Startups</span>
                  </Link>
                </li>
                <li className="nav-item px-1">
                  <Link className={`nav-link ${location.pathname === '/my-dashboard' ? 'active' : ''}`} to="/my-dashboard">
                    <i className="bi bi-speedometer2 me-2"></i>
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li className="nav-item px-1">
                  <Link className={`nav-link ${location.pathname.includes('/browse-startups') ? 'active' : ''}`} to="/browse-startups">
                    <i className="bi bi-search me-2"></i>
                    <span>Discover</span>
                  </Link>
                </li>
                <li className="nav-item px-1">
                  <Link className={`nav-link ${location.pathname.includes('/create-startup') ? 'active' : ''}`} to="/create-startup">
                    <i className="bi bi-plus-circle me-2"></i>
                    <span>Create</span>
                  </Link>
                </li>
                <li className="nav-item px-1">
                  <Link className={`nav-link ${location.pathname.includes('/my-requests') ? 'active' : ''}`} to="/my-requests">
                    <i className="bi bi-envelope me-2"></i>
                    <span>Requests</span>
                  </Link>
                </li>
              </ul>
              <div className="d-flex align-items-center gap-3">
                {/* Theme Toggle Button */}
                <button 
                  className="btn btn-icon" 
                  onClick={toggleTheme}
                  style={{ background: 'transparent', border: 'none', color: 'white' }}
                  aria-label="Toggle dark mode"
                >
                  {isDarkTheme ? (
                    <i className="bi bi-sun-fill fs-5"></i>
                  ) : (
                    <i className="bi bi-moon-fill fs-5"></i>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                <div className="mx-2">
                  <NotificationDropdown 
                    notifications={notifications}
                    onNotificationClick={handleNotificationClick}
                    onMarkAllAsRead={markAllAsRead}
                    onClearAll={clearAllNotifications}
                  />
                </div>
                
                {/* Rating Stars */}
                <div className="mx-2">
                  <RatingStars rating={calculateUserRating()} size="small" />
                </div>
                
                {/* User Menu */}
                <div className="dropdown ms-1">
                  <button className="dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <div className="user-avatar me-2">{getInitial()}</div>
                    <span>{user?.name || user?.email}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person me-2"></i> Profile</Link></li>
                    <li><Link className="dropdown-item" to="/settings"><i className="bi bi-gear me-2"></i> Settings</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Logout</button></li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="navbar-nav ms-auto">
              {/* Theme Toggle Button */}
              <button 
                className="btn btn-icon me-3" 
                onClick={toggleTheme}
                style={{ background: 'transparent', border: 'none', color: 'white' }}
                aria-label="Toggle dark mode"
              >
                {isDarkTheme ? (
                  <i className="bi bi-sun-fill fs-5"></i>
                ) : (
                  <i className="bi bi-moon-fill fs-5"></i>
                )}
              </button>
              <Link to="/login" className="btn btn-outline-light me-2">Login</Link>
              <Link to="/register" className="btn btn-light">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 