import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface AffiliateLink {
  id: string;
  name: string;
  code: string;
  startupId: string;
  userId: string;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
}

interface Startup {
  id: string;
  name: string;
  role?: {
    title: string;
  } | string;
}

const AffiliateLinksPage: React.FC = () => {
  const { user, token } = useAuth();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStartupId, setSelectedStartupId] = useState<string>('');
  const [userStartups, setUserStartups] = useState<Startup[]>([]);

  useEffect(() => {
    if (token) {
      fetchUserStartups();
      fetchAffiliateLinks();
    }
  }, [token]);

  const fetchUserStartups = async () => {
    try {
      setLoading(true);
      // Fetch owned startups
      const ownedResponse = await axios.get('/api/startups/my-startups', {
        headers: { 'x-auth-token': token }
      });
      
      // Fetch joined startups
      const joinedResponse = await axios.get('/api/auth/joined-startups', {
        headers: { 'x-auth-token': token }
      });

      // Combine and deduplicate startups
      const ownedStartups = ownedResponse.data.map((startup: Startup) => ({
        ...startup,
        role: 'Owner'
      }));
      
      const joinedStartups = joinedResponse.data.map((startup: Startup) => ({
        ...startup,
        role: typeof startup.role === 'object' ? startup.role.title : 'Member'
      }));

      // Combine and deduplicate startups by ID
      const allStartups = [...ownedStartups, ...joinedStartups];
      const uniqueStartups = Array.from(
        new Map(allStartups.map(startup => [startup.id, startup])).values()
      );

      setUserStartups(uniqueStartups);
    } catch (err) {
      console.error('Error fetching user startups:', err);
      toast.error('Failed to fetch startups');
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliateLinks = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    try {
      const response = await axios.get(`/api/affiliate-links/user/${user.id}`, {
        headers: { 'x-auth-token': token }
      });
      setLinks(response.data);
    } catch (err) {
      setError('Failed to fetch affiliate links');
      toast.error('Failed to load affiliate links');
    } finally {
      setLoading(false);
    }
  };

  const createNewLink = async () => {
    if (!user?.name) {
      setError('User information not available');
      return;
    }

    if (!selectedStartupId) {
      setError('Please select a startup');
      return;
    }

    try {
      const response = await axios.post('/api/affiliate-links', {
        name: user.name,
        startupId: selectedStartupId,
        type: 'startup'
      }, {
        headers: { 'x-auth-token': token }
      });
      setLinks([response.data, ...links]);
      setSelectedStartupId('');
      setError(null);
      toast.success('Affiliate link created successfully!');
    } catch (err) {
      setError('Failed to create affiliate link');
      toast.error('Failed to create affiliate link');
    }
  };

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/affiliate/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const deleteLink = async (id: string) => {
    try {
      await axios.delete(`/api/affiliate-links/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setLinks(links.filter(link => link.id !== id));
      toast.success('Affiliate link deleted successfully');
    } catch (err) {
      setError('Failed to delete affiliate link');
      toast.error('Failed to delete affiliate link');
    }
  };

  const getAnalytics = (startupId: string) => {
    const filteredLinks = links.filter(link => link.startupId === startupId);

    return {
      totalLinks: filteredLinks.length,
      totalClicks: filteredLinks.reduce((sum, link) => sum + link.clicks, 0),
      totalConversions: filteredLinks.reduce((sum, link) => sum + link.conversions, 0)
    };
  };

  const renderAnalyticsCards = (startupId: string) => {
    const analytics = getAnalytics(startupId);
    
    return (
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total Links</h5>
              <h2>{analytics.totalLinks}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Total Clicks</h5>
              <h2>{analytics.totalClicks}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Total Conversions</h5>
              <h2>{analytics.totalConversions}</h2>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLinksTable = (startupId: string) => {
    const filteredLinks = links.filter(link => link.startupId === startupId);

    return (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Link</th>
              <th>Clicks</th>
              <th>Conversions</th>
              <th>Conversion Rate</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No affiliate links yet. Generate your first link above!
                </td>
              </tr>
            ) : (
              filteredLinks.map((link) => (
                <tr key={link.id}>
                  <td>{link.name}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={`${window.location.origin}/affiliate/${link.code}`}
                        readOnly
                      />
                      <button
                        className="btn btn-sm btn-outline-secondary ms-2"
                        onClick={() => copyToClipboard(link.code)}
                      >
                        <i className="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </td>
                  <td>{link.clicks}</td>
                  <td>{link.conversions}</td>
                  <td>
                    {link.clicks > 0
                      ? `${((link.conversions / link.clicks) * 100).toFixed(1)}%`
                      : '0%'}
                  </td>
                  <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteLink(link.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">Affiliate Links</h2>

      {/* Create new link section */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Create New Affiliate Link</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <select
                className="form-select"
                value={selectedStartupId}
                onChange={(e) => setSelectedStartupId(e.target.value)}
              >
                <option value="">Select Startup</option>
                {userStartups.map(startup => (
                  <option key={startup.id} value={startup.id}>{startup.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <button
                className="btn btn-primary"
                onClick={createNewLink}
                disabled={!selectedStartupId}
              >
                Generate Link
              </button>
            </div>
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
      </div>

      {/* Startup Links Sections */}
      {userStartups.map(startup => (
        <div key={startup.id} className="card mb-4">
          <div className="card-header">
            <h4>{startup.name} - Affiliate Links</h4>
          </div>
          <div className="card-body">
            {renderAnalyticsCards(startup.id)}
            {renderLinksTable(startup.id)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AffiliateLinksPage; 