import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Notification } from './NotificationDropdown';

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  // Auto dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div 
      className={`toast show border-${notification.type}`} 
      role="alert" 
      aria-live="assertive" 
      aria-atomic="true"
    >
      <div className="toast-header">
        <span className={`bg-${notification.type} rounded me-2`} style={{ width: '20px', height: '20px' }}></span>
        <strong className="me-auto">{notification.title}</strong>
        <small className="text-muted">just now</small>
        <button 
          type="button" 
          className="btn-close" 
          onClick={onClose}
          aria-label="Close"
        ></button>
      </div>
      <div className="toast-body">
        {notification.message}
      </div>
    </div>
  );
};

const ToastNotifications: React.FC = () => {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState<Notification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  
  // Check for new notifications
  useEffect(() => {
    if (!notifications.length) return;
    
    // Find notifications that haven't been seen or displayed yet
    const newNotifications = notifications.filter(
      notif => !notif.isRead && !seenIds.has(notif.id)
    );
    
    if (newNotifications.length > 0) {
      // Add new notifications to toasts
      setToasts(prev => [...prev, ...newNotifications]);
      
      // Update seen IDs
      const newSeenIds = new Set(seenIds);
      newNotifications.forEach(notif => newSeenIds.add(notif.id));
      setSeenIds(newSeenIds);
    }
  }, [notifications, seenIds]);
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          notification={toast} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
};

export default ToastNotifications; 