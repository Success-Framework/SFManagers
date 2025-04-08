import React, { createContext, useState, useContext, useEffect } from 'react';
import { Notification } from '../components/common/NotificationDropdown';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotification: () => {},
  clearAllNotifications: () => {},
});

const LOCAL_STORAGE_KEY = 'notifications';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  
  // Load notifications from localStorage on component mount
  useEffect(() => {
    if (user) {
      const storedNotifications = localStorage.getItem(`${LOCAL_STORAGE_KEY}-${user.id}`);
      
      if (storedNotifications) {
        try {
          setNotifications(JSON.parse(storedNotifications));
        } catch (error) {
          console.error('Error parsing stored notifications:', error);
          setNotifications([]);
        }
      }
    } else {
      setNotifications([]);
    }
  }, [user]);
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}-${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    
    // Optional: Play sound notification
    // const audio = new Audio('/notification-sound.mp3');
    // audio.play().catch(e => console.log('Error playing notification sound', e));
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({
        ...notification,
        isRead: true,
      }))
    );
  };
  
  // Clear a specific notification
  const clearNotification = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

export default NotificationContext; 