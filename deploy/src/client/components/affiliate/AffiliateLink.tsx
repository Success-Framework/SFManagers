import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface AffiliateLinkProps {
  startupId: string;
  startupName: string;
}

interface AffiliateLink {
  id: string;
  name: string;
  code: string;
  userId: string;
  startupId: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

const AffiliateLink: React.FC<AffiliateLinkProps> = ({ startupId, startupName }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [affiliateLink, setAffiliateLink] = useState<string>('');
  const [linkData, setLinkData] = useState<AffiliateLink | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Fetch existing affiliate link or create a new one
      fetchOrCreateAffiliateLink();
    }
  }, [isAuthenticated, user?.id, startupId]);

  const fetchOrCreateAffiliateLink = async () => {
    if (!isAuthenticated || !token || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      // First try to fetch existing links for this startup
      const linksResponse = await axios.get(`/api/affiliate-links/startup/${startupId}`, {
        headers: { 'x-auth-token': token }
      });
      
      const links = linksResponse.data;
      console.log('Fetched affiliate links:', links);
      
      // Find a link created by this user
      const userLink = links.find((link: AffiliateLink) => link.userId === user.id);
      
      if (userLink) {
        // Use existing link
        console.log('Using existing affiliate link:', userLink);
        setLinkData(userLink);
        const baseUrl = window.location.origin;
        setAffiliateLink(`${baseUrl}/startup/${startupId}?ref=${userLink.code}`);
        setClickCount(userLink.clicks || 0);
      } else {
        // Create a new link
        await createNewAffiliateLink();
      }
    } catch (error) {
      console.error('Error fetching affiliate links:', error);
      // If error, try to create a new link
      await createNewAffiliateLink();
    } finally {
      setIsLoading(false);
    }
  };

  const createNewAffiliateLink = async () => {
    if (!isAuthenticated || !token || !user?.id) return;
    
    try {
      const linkName = `${startupName} - ${user.name || 'Link'}`;
      
      const createResponse = await axios.post('/api/affiliate-links', {
        name: linkName,
        startupId,
        userId: user.id
      }, {
        headers: { 'x-auth-token': token }
      });
      
      const newLink = createResponse.data;
      console.log('Created new affiliate link:', newLink);
      
      setLinkData(newLink);
      const baseUrl = window.location.origin;
      setAffiliateLink(`${baseUrl}/startup/${startupId}?ref=${newLink.code}`);
      setClickCount(0); // New link has no clicks
    } catch (createError) {
      console.error('Error creating affiliate link:', createError);
      setError('Could not create affiliate link');
      
      // Fallback to using user ID directly
      const baseUrl = window.location.origin;
      setAffiliateLink(`${baseUrl}/startup/${startupId}?ref=${user.id}`);
    }
  };

  const fetchClickStats = async () => {
    if (!isAuthenticated || !token || !user?.id || !linkData) return;
    
    try {
      setIsLoading(true);
      
      // If we have a link in the database, use the actual link data
      if (linkData) {
        setClickCount(linkData.clicks || 0);
      } else {
        // Legacy code for backwards compatibility
        const response = await axios.get(`/api/affiliate/stats/${startupId}/${user.id}`, {
          headers: { 'x-auth-token': token }
        });
        
        setClickCount(response.data.clickCount || 0);
      }
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
      setError('Could not load affiliate stats');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    // If we don't have a link yet, create one first
    if (!linkData && isAuthenticated && user?.id) {
      createNewAffiliateLink().then(() => {
        // Then copy to clipboard
        performCopy();
      });
    } else {
      performCopy();
    }
  };
  
  const performCopy = () => {
    navigator.clipboard.writeText(affiliateLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setError('Failed to copy to clipboard');
      });
  };

  if (!isAuthenticated) {
    return (
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white border-bottom-0 pt-4">
          <h3 className="mb-0 fw-bold">Affiliate Program</h3>
        </div>
        <div className="card-body pt-0">
          <p>Sign in to generate your unique affiliate link for this startup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm mb-4 border-0">
      <div className="card-header bg-white border-bottom-0 pt-4">
        <h3 className="mb-0 fw-bold">Your Affiliate Link</h3>
      </div>
      <div className="card-body pt-0">
        <p>Share this startup with your network using your unique affiliate link.</p>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            value={affiliateLink}
            readOnly
            aria-label="Affiliate link"
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={copyToClipboard}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Loading...
              </>
            ) : copied ? (
              <>
                <i className="bi bi-check-lg me-1"></i> Copied!
              </>
            ) : (
              <>
                <i className="bi bi-clipboard me-1"></i> Copy
              </>
            )}
          </button>
        </div>
        
        <div className="affiliate-stats mt-4">
          <h5>Your Referral Stats</h5>
          {isLoading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="card bg-light">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 text-muted">Total Clicks</p>
                    <h3 className="mb-0">{clickCount}</h3>
                  </div>
                  <div className="fs-1 text-primary">
                    <i className="bi bi-cursor-fill"></i>
                  </div>
                </div>
              </div>
            </div>
          )}
          <p className="text-muted small mt-2">
            Earn points each time someone clicks on your affiliate link and visits {startupName}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateLink; 