import React from 'react';
import { Startup } from '../../types';

interface StartupCardProps {
  startup: Startup;
  onClick: () => void;
}

const StartupCard: React.FC<StartupCardProps> = ({ startup, onClick }) => {
  return (
    <div className="card startup-card h-100 shadow-sm" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <h5 className="mb-0">{startup.name}</h5>
        <div className="small text-muted">Stage: {startup.stage}</div>
      </div>
      <div className="card-body">
        <p className="card-text">
          {startup.details.length > 100 
            ? `${startup.details.substring(0, 100)}...` 
            : startup.details}
        </p>
        <div className="mt-2">
          <div className="small text-muted mb-1">Available Roles:</div>
          <div>
            {startup.roles.filter(role => role.isOpen).map((role, index) => (
              <span 
                key={role.id} 
                className="badge bg-light text-dark me-1 mb-1"
                style={{ border: '1px solid #ddd' }}
              >
                {role.title}
              </span>
            ))}
            {!startup.roles.some(role => role.isOpen) && (
              <span className="small text-muted">No open roles at the moment</span>
            )}
          </div>
        </div>
      </div>
      <div className="card-footer bg-white">
        <div className="d-grid">
          <button className="btn btn-sm btn-outline-primary">View Details</button>
        </div>
      </div>
    </div>
  );
};

export default StartupCard; 