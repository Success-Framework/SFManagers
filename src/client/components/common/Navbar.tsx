import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useMessages } from '../../context/MessageContext';
import RatingStars from './RatingStars';
import NotificationDropdown from './NotificationDropdown';
import GlobalChatModal from './GlobalChatModal';
import axios from 'axios';
import { Button, Badge } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

interface NavbarProps {
  onToggleSidebar: () => void;
}

interface Startup {
  id: string;
  name: string;
  role?: {
    title: string;
  } | string;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { isAuthenticated, user, token, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const { unreadCount, loadInitialData } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(
    localStorage.getItem('theme') === 'dark'
  );
  const [userStartups, setUserStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [messageCount, setMessageCount] = useState(unreadCount);
  const [isFlashing, setIsFlashing] = useState(false);
  const prevMessageCountRef = useRef(messageCount);

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

  // Set initial message count from context
  useEffect(() => {
    setMessageCount(unreadCount);
  }, [unreadCount]);

  // Check if message count has increased to trigger flashing
  useEffect(() => {
    if (messageCount > prevMessageCountRef.current && !showGlobalChat) {
      // Start flashing animation
      setIsFlashing(true);
      
      // Stop flashing after 10 seconds
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
    
    // Update the ref for next comparison
    prevMessageCountRef.current = messageCount;
  }, [messageCount, showGlobalChat]);

  // Get unread count directly from API with better error handling
  const getUnreadCount = async (): Promise<number> => {
    try {
      // Log that we're checking unread count
      console.log('Checking unread message count...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, cannot check unread count');
        return 0;
      }
      
      // Try multiple approaches to get unread count
      let count = 0;
      let success = false;
      
      // First attempt: /api/chat/unread endpoint
      try {
        console.log('Attempting to fetch unread count from chat API...');
        const response = await axios.get('/api/chat/unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Chat API response:', response.data);
        
        if (response.data && typeof response.data.count === 'number') {
          count = response.data.count;
          success = true;
        } else if (response.data && response.data.unreadCounts) {
          count = Object.values(response.data.unreadCounts).reduce(
            (sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 
            0
          );
          success = true;
        }
      } catch (error) {
        console.warn('First endpoint failed:', error);
      }
      
      // Second attempt: /api/messages/unread endpoint
      if (!success) {
        try {
          console.log('Attempting to fetch unread count from messages API...');
          const response = await axios.get('/api/messages/unread', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log('Messages API response:', response.data);
          
          if (response.data && typeof response.data.count === 'number') {
            count = response.data.count;
            success = true;
          } else if (Array.isArray(response.data)) {
            count = response.data.reduce(
              (sum: number, item: any) => sum + (typeof item.count === 'number' ? item.count : 0), 
              0
            );
            success = true;
          }
        } catch (error) {
          console.warn('Second endpoint failed:', error);
        }
      }
      
      // Log the final count
      console.log('Final unread count:', count);
      return count;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  };

  // Replace the polling useEffect with this more robust version
  useEffect(() => {
    // Only poll when authenticated and not viewing the chat
    if (!isAuthenticated) return;
    
    // Debugging - confirm the effect is running
    console.log('Unread message polling activated');
    
    // Function to check messages and update UI
    const checkUnreadMessages = async () => {
      try {
        console.log('Checking for new messages...');
        const newCount = await getUnreadCount();
        const oldCount = messageCount;
        
        // Log the comparison
        console.log(`Message count: ${oldCount} -> ${newCount}`);
        
        // Only update state if count changed to avoid re-renders
        if (newCount !== oldCount) {
          setMessageCount(newCount);
          
          // If message count increased and chat is not open, flash button
          if (newCount > oldCount && !showGlobalChat) {
            console.log('New messages detected - flashing button');
            setIsFlashing(true);
            
            // Show a toast notification
            toast('You have new messages', {
              icon: '💬',
              position: 'top-right',
              duration: 3000,
            });
            
            // Stop flashing after 10 seconds
            setTimeout(() => {
              if (!showGlobalChat) {  // Only stop if chat still closed
                console.log('Stopping flash animation');
                setIsFlashing(false);
              }
            }, 10000);
          }
        }
      } catch (error) {
        console.error('Error checking unread messages:', error);
      }
    };
    
    // Check immediately on mount
    checkUnreadMessages();
    
    // Then set up interval - more frequent polling (every 3 seconds)
    const intervalId = setInterval(checkUnreadMessages, 3000);
    
    // Clean up interval on unmount
    return () => {
      console.log('Cleaning up message polling interval');
      clearInterval(intervalId);
    };
  }, [isAuthenticated, showGlobalChat, messageCount]);

  const fetchUserStartups = async () => {
    try {
      setLoading(true);
      // Fetch owned startups
      const ownedResponse = await axios.get('/api/startups/my-startups', {
        headers: { 'x-auth-token': token }
      });
      
      // Fetch joined startups
      const joinedResponse = await axios.get('/api/auth/joined-startups', {
        headers: { 'x-auth-token': token }
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

  const handleOpenGlobalChat = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Opening global chat');
    setShowGlobalChat(true);
    setIsFlashing(false); // Stop flashing when opening chat
  };

  // Handle unread count change from the chat modal
  const handleUnreadCountChange = (count: number) => {
    setMessageCount(count);
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
                <div className="mx-2 position-relative">
                  <Button 
                    variant={isFlashing ? 'danger' : 'primary'} 
                    className={`chat-button ${isFlashing ? 'chat-button-flash' : ''}`}
                    onClick={handleOpenGlobalChat}
                  >
                    <i className="fas fa-comments"></i>
                    {messageCount > 0 && (
                      <Badge 
                        bg="danger" 
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                        style={{ fontSize: '0.7rem', padding: '0.35em 0.5em' }}
                      >
                        {messageCount > 99 ? '99+' : messageCount}
                      </Badge>
                    )}
                  </Button>
                </div>
                
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
                <div className="dropdown">
                  <button 
                    className="btn btn-icon dropdown-toggle" 
                    type="button" 
                    id="userDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                    style={{ background: 'transparent', border: 'none', color: 'white' }}
                  >
                    <div className="avatar-circle">
                      {getInitial()}
                    </div>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2"></i>
                        Profile
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
      
      {/* Global Chat Modal */}
      <GlobalChatModal
        isOpen={showGlobalChat}
        onClose={() => setShowGlobalChat(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />

      {/* CSS Animation for flashing chat button */}
      <style>{`
        @keyframes flash {
          0% { background-color: var(--bs-danger); }
          50% { background-color: var(--bs-primary); }
          100% { background-color: var(--bs-danger); }
        }
        
        .chat-button {
          position: relative;
          padding: 0.5rem 0.75rem;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .chat-button-flash {
          animation: flash 0.8s infinite;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }
        
        .chat-button .badge {
          top: -5px !important;
          right: -5px !important;
          transform: none !important;
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 