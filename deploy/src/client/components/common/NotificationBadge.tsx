import React from 'react';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  color?: 'primary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
  className?: string;
}

/**
 * A component that displays a notification badge with a count
 * Can be wrapped around icons or buttons to indicate notifications
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  onClick,
  color = 'danger',
  size = 'medium',
  children,
  className = ''
}) => {
  // Don't render badge if count is 0
  if (count <= 0 && !children) {
    return null;
  }

  // Hide the count if it's 0 but still show children
  const showCount = count > 0;
  
  // Determine size class
  const sizeClass = size === 'small' ? 'badge-sm' : size === 'large' ? 'badge-lg' : '';
  
  // If there are children, create a wrapper with the badge
  if (children) {
    return (
      <div className={`position-relative d-inline-block ${className}`} onClick={onClick}>
        {children}
        {showCount && (
          <span 
            className={`position-absolute top-0 start-100 translate-middle badge rounded-pill bg-${color} ${sizeClass}`}
          >
            {count > 99 ? '99+' : count}
            <span className="visually-hidden">notifications</span>
          </span>
        )}
      </div>
    );
  }
  
  // If no children, just render the badge
  return (
    <span 
      className={`badge rounded-pill bg-${color} ${sizeClass} ${className}`}
      onClick={onClick}
    >
      {count > 99 ? '99+' : count}
      <span className="visually-hidden">notifications</span>
    </span>
  );
};

export default NotificationBadge; 