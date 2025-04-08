import React, { ReactElement } from 'react';
import { Startup, Role } from '../types';

interface StartupListProps {
  startups: Startup[];
}

const StartupList: React.FC<StartupListProps> = ({ startups }) => {
  if (startups.length === 0) {
    return (
      <div className="alert alert-info mt-4" role="alert">
        No startups registered yet. Be the first to add one!
      </div>
    );
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to escape HTML to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Function to render role badges
  const renderRoleBadges = (roles: Role[]): ReactElement[] => {
    return roles.map(role => (
      <span key={role.id} className="role-badge">
        {escapeHtml(role.title)}
      </span>
    ));
  };

  return (
    <div className="mt-5">
      <h3 className="mb-4">Registered Startups</h3>
      <div className="row">
        {startups.map(startup => (
          <div className="col-md-6 mb-4" key={startup.id}>
            <div className="card startup-card">
              <div className="card-header">
                <h5 className="mb-0">{escapeHtml(startup.name)}</h5>
                <small>Stage: {escapeHtml(startup.stage)}</small>
              </div>
              <div className="card-body">
                <p>{escapeHtml(startup.details)}</p>
                <div className="mt-3">
                  <strong>Roles:</strong>
                  <div className="mt-2">
                    {renderRoleBadges(startup.roles)}
                  </div>
                </div>
                <div className="mt-3 text-muted">
                  <small>Created: {formatDate(startup.createdAt)}</small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StartupList; 