import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ChatNotificationPopup from './ChatNotificationPopup';
import './ChatNotificationPopup.css';

interface ChatNotification {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  avatar?: string;
  groupId?: string;
  onClick?: () => void;
}

// Define TypeScript global type definitions
declare global {
  interface Window {
    addChatNotification: (sender: string, message: string, avatar?: string, groupId?: string) => void;
    openGlobalChat: (userId?: string, groupId?: string) => void;
    testChatNotification: () => void;
  }
}

const ChatNotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [notificationContainerReady, setNotificationContainerReady] = useState(false);
  const notificationContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Create the notification container if it doesn't exist
  useEffect(() => {
    let container = document.getElementById('chat-notifications-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'chat-notifications-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
      console.log('Created chat notifications container');
    }
    
    notificationContainerRef.current = container as HTMLDivElement;
    setNotificationContainerReady(true);
    
    return () => {
      // Don't remove the container on unmount, as it might be needed by other instances
    };
  }, []);

  // Play notification sound - with comprehensive error handling
  const playNotificationSound = () => {
    try {
      // Try to play a simple sound using Audio API first (more compatible)
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'; // Base64 encoded short beep
      audio.volume = 0.5;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Simple audio play failed:', error);
          
          // Fallback to AudioContext method
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
          } catch (fallbackError) {
            console.error('Fallback audio method also failed:', fallbackError);
          }
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Add notification with robust error handling
  const addNotification = (notification: Omit<ChatNotification, 'id'>) => {
    try {
      const id = Date.now().toString();
      
      console.log('Adding notification:', {
        id,
        sender: notification.sender,
        message: notification.message
      });
      
      setNotifications(prev => {
        // Limit to 3 notifications at a time
        const updated = [...prev, { ...notification, id }];
        if (updated.length > 3) {
          return updated.slice(updated.length - 3);
        }
        return updated;
      });
      
      // Play notification sound
      playNotificationSound();
      
      // Also show a console message to confirm
      console.log(`Notification added: ${notification.sender} - ${notification.message}`);
      
      return id; // Return ID for reference
    } catch (error) {
      console.error('Error adding notification:', error);
      return null;
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Expose addNotification method to window
  useEffect(() => {
    // Create safety function in case the real one fails
    const safeAddNotification = (sender: string, message: string, avatar?: string, groupId?: string) => {
      try {
        console.log('SafeAddNotification called:', { sender, message });
        return addNotification({
          sender,
          message,
          timestamp: new Date(),
          avatar,
          groupId,
          onClick: () => {
            try {
              if (window.openGlobalChat) {
                window.openGlobalChat(undefined, groupId);
              }
            } catch (error) {
              console.error('Error in notification onClick:', error);
            }
          }
        });
      } catch (error) {
        console.error('Error in safeAddNotification:', error);
        return null;
      }
    };
    
    // Assign to window object
    window.addChatNotification = safeAddNotification;
    
    // Add test function
    window.testChatNotification = () => {
      console.log('Test notification triggered');
      window.addChatNotification(
        'Test User',
        'This is a test notification. Click to open chat.',
        undefined
      );
    };
    
    // Listen for manual test events
    const handleManualTest = (event: Event) => {
      console.log('Manual test notification event received', event);
      window.addChatNotification(
        'Manual Test',
        'This notification was triggered manually',
        undefined
      );
    };
    document.addEventListener('manualTestNotification', handleManualTest);
    
    // Debug: verify the function exists
    console.log('ChatNotificationManager: Initialized global functions');
    console.log('- window.addChatNotification:', typeof window.addChatNotification);
    console.log('- window.testChatNotification:', typeof window.testChatNotification);
    
    return () => {
      // Clean up
      document.removeEventListener('manualTestNotification', handleManualTest);
      
      // Handle cleanup properly to avoid errors
      if ('addChatNotification' in window) {
        window.addChatNotification = () => {}; // Empty function
      }
      if ('testChatNotification' in window) {
        window.testChatNotification = () => {}; // Empty function
      }
    };
  }, []);
  
  // Listen for direct document events as a backup method
  useEffect(() => {
    const handleDirectNotification = (event: CustomEvent) => {
      const { sender, message, avatar, groupId } = event.detail || {};
      if (sender && message) {
        addNotification({
          sender,
          message,
          timestamp: new Date(),
          avatar,
          groupId,
          onClick: () => {
            if (window.openGlobalChat) {
              window.openGlobalChat(undefined, groupId);
            }
          }
        });
      }
    };
    
    document.addEventListener('addChatNotification', handleDirectNotification as EventListener);
    
    return () => {
      document.removeEventListener('addChatNotification', handleDirectNotification as EventListener);
    };
  }, []);

  // If there are no notifications or container isn't ready, render nothing
  if (notifications.length === 0 || !notificationContainerReady) {
    return null;
  }

  // Use portal to render notifications into the designated container
  return ReactDOM.createPortal(
    <>
      {notifications.map(notification => (
        <ChatNotificationPopup
          key={notification.id}
          sender={notification.sender}
          message={notification.message}
          timestamp={notification.timestamp}
          avatar={notification.avatar}
          onClick={notification.onClick}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>,
    notificationContainerRef.current || document.body
  );
};

export default ChatNotificationManager; 