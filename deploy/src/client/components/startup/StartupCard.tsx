import React, { useState } from 'react';
import { Startup } from '../../types';

interface StartupCardProps {
  startup: Startup;
  onClick: () => void;
}

const StartupCard: React.FC<StartupCardProps> = ({ startup, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format the logo path correctly
  const getLogoPath = (logoPath: string | undefined) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return logoPath.startsWith('/uploads') ? logoPath : `/uploads/${logoPath.split('/').pop()}`;
  };

  const logoPath = getLogoPath(startup.logo);

  return (
    <div 
      className="startup-card" 
      onClick={onClick} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="startup-card-inner">
        <div className="startup-logo-container">
          {logoPath ? (
            <img 
              src={logoPath} 
              alt={`${startup.name} logo`} 
              className="startup-logo"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = 'https://via.placeholder.com/150?text=Logo';
              }}
            />
          ) : (
            <div className="startup-fallback-logo">
              {startup.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="startup-card-content">
          <h3 className="startup-name">{startup.name}</h3>
          <div className="startup-stage">
            <span className="stage-badge">{startup.stage}</span>
          </div>
          <p className="startup-description">
            {startup.details.length > 100 
              ? `${startup.details.substring(0, 100)}...` 
              : startup.details}
          </p>
          {isHovered && (
            <div className="startup-card-hover-info">
              <div className="role-badge-container">
                {startup.roles.filter(role => role.isOpen).slice(0, 3).map((role, index) => (
                  <span 
                    key={role.id || index} 
                    className="role-badge"
                  >
                    {role.title}
                  </span>
                ))}
                {startup.roles.filter(role => role.isOpen).length > 3 && (
                  <span className="role-badge more-roles">
                    +{startup.roles.filter(role => role.isOpen).length - 3} more
                  </span>
                )}
              </div>
              <button className="view-details-btn">
                <span>Explore</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartupCard; 