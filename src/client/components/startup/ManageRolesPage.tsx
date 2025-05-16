import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ManageRolesModal from './ManageRolesModal';

// Using a generic type to avoid type mismatches between components
interface StartupData {
  id: string;
  name: string;
  details: string;
  stage: string;
  logo?: string;
  banner?: string;
  website?: string;
  location?: string;
  industry?: string;
  ownerId: string;
  owner: any;
  roles: any[];
  createdAt: string;
  [key: string]: any; // Allow for additional properties
}

const ManageRolesPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  
  const [startup, setStartup] = useState<StartupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startupId) {
      setError('No startup ID provided');
      setLoading(false);
      return;
    }

    if (!isAuthenticated || !token) {
      navigate('/login', { replace: true });
      return;
    }

    fetchStartupDetails();
  }, [startupId, isAuthenticated, token]);

  const fetchStartupDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching startup details for roles page, ID:', startupId);
      
      const response = await fetch(`/api/startups/${startupId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        throw new Error(`Failed to fetch startup details: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Startup data retrieved for roles management:', data);
      setStartup(data);
    } catch (err) {
      console.error('Error in fetchStartupDetails:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRolesUpdate = () => {
    // After successful update, navigate back to the startup detail page
    fetchStartupDetails();
  };

  const handleCancel = () => {
    // Navigate back to the startup detail page
    navigate(`/startup/${startupId}`);
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error || 'Startup not found'}</div>
        <button 
          className="btn btn-primary mt-3"
          onClick={() => navigate('/browse-startups')}
        >
          Browse Startups
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <ManageRolesModal
            startup={startup as any}
            onSave={handleRolesUpdate}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default ManageRolesPage; 