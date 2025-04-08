import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
  onClearAll
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.isRead).length;
  
  // Format date to relative time (like "2 hours ago")
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Less than a minute
    if (seconds < 60) {
      return 'just now';
    }
    
    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Format as MM/DD/YYYY
    return date.toLocaleDateString();
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setIsOpen(false);
  };
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div className="notification-dropdown dropdown" ref={dropdownRef}>
      <div onClick={toggleDropdown} style={{ cursor: 'pointer' }}>
        <NotificationBadge count={unreadCount}>
          <i className="bi bi-bell-fill fs-5"></i>
        </NotificationBadge>
      </div>
      
      {isOpen && (
        <div className="dropdown-menu dropdown-menu-end notification-dropdown-menu show p-0">
          <div className="notification-header d-flex justify-content-between align-items-center p-3 border-bottom">
            <h6 className="m-0">Notifications</h6>
            <div>
              {notifications.length > 0 && (
                <>
                  {onMarkAllAsRead && (
                    <button 
                      className="btn btn-sm btn-link text-decoration-none" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onMarkAllAsRead(); 
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                  {onClearAll && (
                    <button 
                      className="btn btn-sm btn-link text-decoration-none" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onClearAll(); 
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="notification-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center p-4">
                <i className="bi bi-bell-slash fs-3 text-muted"></i>
                <p className="mt-2 mb-0 text-muted">No notifications</p>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {notifications.map(notification => (
                  <li 
                    key={notification.id}
                    className={`list-group-item list-group-item-action p-3 ${!notification.isRead ? 'notification-unread' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: !notification.isRead ? 'rgba(13, 110, 253, 0.05)' : 'transparent'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.link ? (
                      <Link 
                        to={notification.link} 
                        className="text-decoration-none text-dark"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="notification-item">
                          <div className="d-flex align-items-center mb-1">
                            <span className={`notification-indicator bg-${notification.type} me-2`}></span>
                            <strong className="me-auto">{notification.title}</strong>
                            <small className="text-muted">{formatRelativeTime(notification.createdAt)}</small>
                          </div>
                          <div className="text-body-secondary small">{notification.message}</div>
                        </div>
                      </Link>
                    ) : (
                      <div className="notification-item">
                        <div className="d-flex align-items-center mb-1">
                          <span className={`notification-indicator bg-${notification.type} me-2`}></span>
                          <strong className="me-auto">{notification.title}</strong>
                          <small className="text-muted">{formatRelativeTime(notification.createdAt)}</small>
                        </div>
                        <div className="text-body-secondary small">{notification.message}</div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 