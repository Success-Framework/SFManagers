import React, { useEffect, useState } from 'react';
import './ChatNotificationPopup.css';

interface ChatNotificationProps {
  sender: string;
  message: string;
  timestamp: Date;
  avatar?: string;
  onClick?: () => void;
  onClose?: () => void;
}

const ChatNotificationPopup: React.FC<ChatNotificationProps> = ({
  sender,
  message,
  timestamp,
  avatar,
  onClick,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleClick = () => {
    if (onClick) onClick();
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="chat-notification-popup" onClick={handleClick}>
      <div className="notification-avatar">
        {avatar ? (
          <img src={avatar} alt={sender} />
        ) : (
          <div className="default-avatar">{sender.charAt(0)}</div>
        )}
      </div>
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-sender">{sender}</span>
          <span className="notification-time">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="notification-message">{message}</div>
      </div>
      <button className="notification-close" onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}>
        &times;
      </button>
    </div>
  );
};

export default ChatNotificationPopup; 