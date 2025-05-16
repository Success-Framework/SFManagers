import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PublicStartupPreview from './PublicStartupPreview';

const AffiliateRedirect: React.FC = () => {
  const { code, startupId: urlStartupId } = useParams<{ code: string; startupId?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [startupId, setStartupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trackClick = async () => {
      try {
        // Track the click and get the startup ID in one request
        const response = await axios.post(`/api/affiliate-links/track`, {
          code,
          referrer: document.referrer || ''
        });

        if (response.data.success && response.data.startupId) {
          setStartupId(response.data.startupId);
          
          // If user is already authenticated, redirect to startup page
          if (isAuthenticated) {
            navigate(`/startup/${response.data.startupId}`);
          }
        } else {
          setError('Invalid or expired affiliate link');
        }
      } catch (err) {
        console.error('Error tracking affiliate click:', err);
        setError('Invalid or expired affiliate link');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      trackClick();
    }
  }, [code, navigate, isAuthenticated]);

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

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!startupId) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Startup not found
        </div>
      </div>
    );
  }

  return <PublicStartupPreview startupId={startupId} affiliateCode={code || ''} />;
};

export default AffiliateRedirect; 