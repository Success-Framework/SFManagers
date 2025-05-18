import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useMessages } from '../../context/MessageContext';
import RatingStars from './RatingStars';
import NotificationDropdown from './NotificationDropdown';
import MessagesButton from './MessagesButton';
import axios from 'axios';
import { Button, Badge } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

// Define simple interface for startups
interface Startup {
  id: string;
  name: string;
  role?: string | { title: string };
  // Add other properties as needed
}

// Add props interface for Navbar component
interface NavbarProps {
  onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  console.log('Rendering updated Navbar with fixed message button');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, token } = useAuth();
  const { notifications, markAllAsRead } = useNotifications();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(
    localStorage.getItem('theme') === 'dark'
  );
  const [userStartups, setUserStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  // Reference to track welcome notification
  const welcomeNotificationShownRef = useRef(false);

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

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchUserStartups();
    }
  }, [isAuthenticated, token]);

  const fetchUserStartups = async () => {
    try {
      setLoading(true);
      // Fetch owned startups
      const ownedResponse = await axios.get('/api/startups/my-startups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch joined startups
      const joinedResponse = await axios.get('/api/auth/joined-startups', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Combine and deduplicate startups
      const ownedStartups = ownedResponse.data.map((startup: Startup) => ({
        ...startup,
        role: 'Owner'
      }));
      
      const joinedStartups = joinedResponse.data.map((startup: Startup) => ({
        ...startup,
        role: typeof startup.role === 'object' ? startup.role.title : 'Member'
      }));

      // Combine and deduplicate startups by ID
      const allStartups = [...ownedStartups, ...joinedStartups];
      const uniqueStartups = Array.from(
        new Map(allStartups.map(startup => [startup.id, startup])).values()
      );

      setUserStartups(uniqueStartups);
    } catch (err) {
      console.error('Error fetching user startups:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleLogout = () => {
    // First navigate to login page, then logout to avoid any race conditions
    navigate('/login');
    // Add a small delay before actually logging out to ensure navigation completes
    setTimeout(() => {
      logout();
    }, 50);
  };

  // Handle opening the chat
  const handleOpenGlobalChat = () => {
    // Navigate to messages page instead of using modal
    navigate('/messages');
  };

  // Don't show navbar on login or register pages or when redirecting
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
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
    
    // Using level-based calculation (assuming max level is around 50)
    const levelBasedRating = Math.min(5, (user.level || 1) / 10);
    
    return levelBasedRating;
  };

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    markAllAsRead();
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Clear all notifications (placeholder function for now)
  const clearAllNotifications = () => {
    // This would normally be implemented in the notification context
    console.log('Clearing all notifications');
  };

  return (
    <>
      <nav className="navbar navbar-gamified navbar-expand-lg fixed-top">
        <div className="container">
          <Link className="navbar-brand me-4" to={isAuthenticated ? "/my-dashboard" : "/login"}>
            <i className="bi bi-rocket-takeoff-fill me-2"></i>
            <span>SFManagers</span>
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            {isAuthenticated ? (
              <>
                <ul className="navbar-nav mx-auto">
                  <li className="nav-item mx-2">
                    <Link className={`nav-link ${location.pathname === '/my-dashboard' || location.pathname.includes('/my-startups') ? 'active' : ''}`} to="/my-dashboard">
                      <i className="bi bi-speedometer2 me-2"></i>
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li className="nav-item mx-2">
                    <Link className={`nav-link ${location.pathname.includes('/browse-startups') ? 'active' : ''}`} to="/browse-startups">
                      <i className="bi bi-search me-2"></i>
                      <span>Discover</span>
                    </Link>
                  </li>
                  <li className="nav-item mx-2">
                    <Link className={`nav-link ${location.pathname.includes('/profiles') ? 'active' : ''}`} to="/profiles">
                      <i className="bi bi-people me-2"></i>
                      <span>Profiles</span>
                    </Link>
                  </li>
                  <li className="nav-item mx-2">
                    <Link className={`nav-link ${location.pathname.includes('/create-startup') ? 'active' : ''}`} to="/create-startup">
                      <i className="bi bi-plus-circle me-2"></i>
                      <span>Create</span>
                    </Link>
                  </li>
                  <li className="nav-item mx-2">
                    <Link className={`nav-link ${location.pathname.includes('/affiliate-links') ? 'active' : ''}`} to="/affiliate-links">
                      <i className="bi bi-link-45deg me-2"></i>
                      <span>Affiliate Links</span>
                    </Link>
                  </li>
                  <li className="nav-item mx-2">
                    <Link className={`nav-link ${location.pathname.includes('/my-requests') ? 'active' : ''}`} to="/my-requests">
                      <i className="bi bi-envelope me-2"></i>
                      <span>Requests</span>
                    </Link>
                  </li>
                  <li className="nav-item mx-2">
                    <Link className={`nav-link ${location.pathname.includes('/freelance') ? 'active' : ''}`} to="/freelance">
                      <i className="bi bi-briefcase me-2"></i>
                      <span>Freelance</span>
                    </Link>
                  </li>
                </ul>
                <div className="d-flex align-items-center gap-3">
                  {/* Messages Button */}
                  <MessagesButton token={token} />
                  
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
                      notifications={notifications || []}
                      onNotificationClick={handleNotificationClick}
                      onMarkAllAsRead={markAllAsRead}
                      onClearAll={clearAllNotifications}
                    />
                  </div>
                  
                  {/* User Menu */}
                  <div className="dropdown">
                    <button 
                      className="btn dropdown-toggle d-flex align-items-center" 
                      type="button" 
                      id="userDropdown" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      <div className="avatar-container me-2">
                        {user?.profileImage ? (
                          <img 
                            src={`/uploads/profiles/${user.profileImage}`} 
                            alt={user?.name || 'User'} 
                            className="rounded-circle"
                            width="36"
                            height="36"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div 
                            className="avatar-circle rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                            style={{ width: '36px', height: '36px', fontSize: '1rem' }}
                          >
                            {getInitial()}
                          </div>
                        )}
                      </div>
                      <div className="d-none d-md-block text-start">
                        <div className="text-light fw-medium">{user?.name || 'User'}</div>
                        <div className="stars-container">
                          <RatingStars rating={calculateUserRating()} />
                        </div>
                      </div>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                      <li>
                        <Link className="dropdown-item" to="/profile">
                          <i className="bi bi-person me-2"></i>
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/settings">
                          <i className="bi bi-gear me-2"></i>
                          Settings
                        </Link>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              // Not authenticated - show auth links
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    <i className="bi bi-person-plus me-2"></i>
                    Register
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar; 