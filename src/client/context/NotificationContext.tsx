import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Notification } from '../components/common/NotificationDropdown';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotification: () => {},
  clearAllNotifications: () => {},
  fetchNotifications: async () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { token, user } = useAuth();
  
  // Function to fetch notifications from the server
  const fetchNotifications = async () => {
    if (!token || !user) return;
    
    try {
      const response = await axios.get('/api/notifications/user', {
        headers: { 'x-auth-token': token }
      });
      
      if (response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Fetch notifications when component mounts or user/token changes
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
      
      // Set up polling to check for new notifications every 30 seconds
      const intervalId = setInterval(() => {
        fetchNotifications();
      }, 30000); // 30 seconds
      
      // Clean up interval when component unmounts or dependencies change
      return () => clearInterval(intervalId);
    } else {
      setNotifications([]);
    }
  }, [user, token]);
  
  // Mark a notification as read
  const markAsRead = async (id: string) => {
    if (!token) return;
    
    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;
    
    try {
      await axios.patch('/api/notifications/mark-all-read', {}, {
        headers: { 'x-auth-token': token }
      });
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Clear a specific notification
  const clearNotification = async (id: string) => {
    if (!token) return;
    
    try {
      await axios.delete(`/api/notifications/${id}`, {
        headers: { 'x-auth-token': token }
      });
      
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };
  
  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!token) return;
    
    try {
      await axios.delete('/api/notifications/clear-all', {
        headers: { 'x-auth-token': token }
      });
      
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };
  
  // This function is kept for API compatibility, but only backend should create notifications
  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    console.warn('Frontend notification creation is disabled. Notifications should only come from the backend.');
    // Fetch latest notifications to ensure we have any new ones from the server
    fetchNotifications();
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

export default NotificationContext; 