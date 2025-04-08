import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Role {
  id: string;
  title: string;
  roleType: string;
  isOpen: boolean;
  assignedUser?: User;
}

interface Startup {
  id: string;
  name: string;
  details: string;
  stage: string;
  ownerId: string;
  owner: User;
  roles: Role[];
  createdAt: string;
}

interface StartupDetailProps {
  startup: Startup;
  onSelectRole?: (roleId: string) => void;
  compact?: boolean;
}

const StartupDetail: React.FC<StartupDetailProps> = ({ 
  startup, 
  onSelectRole,
  compact = false
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const isOwner = isAuthenticated && user?.id === startup.ownerId;
  const openRoles = startup.roles.filter(role => role.isOpen);
  const filledRoles = startup.roles.filter(role => !role.isOpen);
  
  return (
    <div className={`startup-detail ${compact ? 'p-0' : 'p-4'}`}>
      <div className={`d-flex justify-content-between align-items-start ${compact ? 'mb-3' : 'mb-4'}`}>
        <div>
          <h3 className="mb-0">{startup.name}</h3>
          <p className="text-muted">{startup.stage} stage</p>
        </div>
        
        {!compact && isOwner && (
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/startup/${startup.id}/requests`)}
            >
              Manage Requests
            </button>
          </div>
        )}
      </div>
      
      <div className={compact ? 'mb-3' : 'mb-4'}>
        <h5>About</h5>
        <p>{startup.details}</p>
      </div>
      
      <div className={compact ? 'mb-3' : 'mb-4'}>
        <h5>Founder</h5>
        <div className="d-flex align-items-center mt-2">
          <div className="bg-primary text-white rounded-circle p-2 me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {startup.owner.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="mb-0 fw-bold">{startup.owner.name}</p>
            <p className="text-muted mb-0">Founder</p>
          </div>
        </div>
      </div>
      
      <div className={compact ? 'mb-3' : 'mb-5'}>
        <h5>Team Members</h5>
        {filledRoles.length === 0 ? (
          <p className="text-muted">No team members yet other than the founder.</p>
        ) : (
          <div className="mt-2">
            {filledRoles.map(role => (
              <div key={role.id} className="d-flex align-items-center mt-2">
                <div className="bg-secondary text-white rounded-circle p-2 me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {role.assignedUser?.name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="mb-0 fw-bold">{role.assignedUser?.name}</p>
                  <p className="text-muted mb-0">{role.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h5>Open Positions</h5>
        {openRoles.length === 0 ? (
          <p className="text-muted">No open positions at the moment.</p>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 g-3 mt-1">
            {openRoles.map(role => (
              <div className="col" key={role.id}>
                <div className={`card h-100 ${onSelectRole ? 'cursor-pointer' : ''}`} onClick={() => onSelectRole && onSelectRole(role.id)}>
                  <div className="card-body">
                    <h6 className="card-title">{role.title}</h6>
                    <span className="badge bg-success">Open</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupDetail; 