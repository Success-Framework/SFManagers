import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface StartupPreview {
  id: string;
  name: string;
  description: string;
  logo?: string;
  industry?: string;
  location?: string;
}

interface PublicStartupPreviewProps {
  startupId: string;
  affiliateCode: string;
}

const PublicStartupPreview: React.FC<PublicStartupPreviewProps> = ({ startupId, affiliateCode }) => {
  const [startup, setStartup] = useState<StartupPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStartupPreview = async () => {
      try {
        const response = await axios.get(`/api/startups/${startupId}/public-preview`);
        setStartup(response.data);
      } catch (err) {
        setError('Failed to load startup preview');
      } finally {
        setLoading(false);
      }
    };

    fetchStartupPreview();
  }, [startupId]);

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
        <div className="alert alert-danger">
          {error || 'Startup not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3 text-center mb-3 mb-md-0">
              {startup.logo ? (
                <img 
                  src={startup.logo} 
                  alt={`${startup.name} logo`} 
                  className="img-fluid rounded"
                  style={{ maxWidth: '200px' }}
                />
              ) : (
                <div 
                  className="bg-light rounded d-flex align-items-center justify-content-center"
                  style={{ width: '200px', height: '200px' }}
                >
                  <i className="bi bi-building text-muted" style={{ fontSize: '3rem' }}></i>
                </div>
              )}
            </div>
            <div className="col-md-9">
              <h1 className="card-title h2 mb-3">{startup.name}</h1>
              
              <div className="mb-4">
                {startup.industry && (
                  <span className="badge bg-secondary me-2">
                    <i className="bi bi-briefcase me-1"></i>
                    {startup.industry}
                  </span>
                )}
                {startup.location && (
                  <span className="badge bg-secondary">
                    <i className="bi bi-geo-alt me-1"></i>
                    {startup.location}
                  </span>
                )}
              </div>

              <p className="card-text lead mb-4">{startup.description}</p>

              <div className="d-grid gap-2 d-md-flex">
                <Link 
                  to={`/login?redirect=/startup/${startupId}&ref=${affiliateCode}`} 
                  className="btn btn-primary btn-lg"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign in to Learn More
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-outline-primary btn-lg"
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicStartupPreview; 