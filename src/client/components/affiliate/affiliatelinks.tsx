import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface AffiliateLink {
  id: string;
  name: string;
  code: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

interface AffiliateLinkProps {
  startupId: string;
}

const AffiliateLinks: React.FC<AffiliateLinkProps> = ({ startupId }) => {
  const { token, user } = useAuth();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [newLinkName, setNewLinkName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [startupId]);

  const fetchLinks = async () => {
    try {
      const response = await axios.get(`/api/affiliate-links/${startupId}`, {
        headers: { 'x-auth-token': token }
      });
      setLinks(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error fetching affiliate links');
      setLoading(false);
    }
  };

  const generateLink = async () => {
    if (!newLinkName.trim()) {
      setError('Please enter a name for your affiliate link');
      return;
    }

    try {
      const response = await axios.post('/api/affiliate-links', {
        name: newLinkName,
        startupId,
        userId: user?.id
      }, {
        headers: { 'x-auth-token': token }
      });

      setLinks([...links, response.data]);
      setNewLinkName('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error generating affiliate link');
    }
  };

  const copyLink = (code: string) => {
    const fullLink = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(fullLink)
      .then(() => alert('Link copied to clipboard!'))
      .catch(() => alert('Failed to copy link'));
  };

  const deleteLink = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this affiliate link?')) return;

    try {
      await axios.delete(`/api/affiliate-links/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setLinks(links.filter(link => link.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Error deleting affiliate link');
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="affiliate-links-container">
      <button
        className="btn btn-primary mb-3"
        onClick={() => setShowGenerator(!showGenerator)}
      >
        {showGenerator ? 'Hide Generator' : 'Show Generator'} <i className={`bi bi-chevron-${showGenerator ? 'up' : 'down'}`}></i>
      </button>

      {showGenerator && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">Generate New Affiliate Link</h5>
            <div className="row g-3 align-items-center">
              <div className="col-auto">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter link name"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                />
              </div>
              <div className="col-auto">
                <button
                  className="btn btn-primary"
                  onClick={generateLink}
                  disabled={!newLinkName.trim()}
                >
                  Generate Link
                </button>
              </div>
            </div>
            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Your Affiliate Links</h5>
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
                {links.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No affiliate links yet. Generate your first link above!
                    </td>
                  </tr>
                ) : (
                  links.map(link => (
                    <tr key={link.id}>
                      <td>{link.name}</td>
                      <td>
                        <code className="me-2">{`${window.location.origin}/ref/${link.code}`}</code>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => copyLink(link.code)}
                          title="Copy link"
                        >
                          <i className="bi bi-clipboard"></i>
                        </button>
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
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteLink(link.id)}
                          title="Delete link"
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
        </div>
      </div>
    </div>
  );
};

export default AffiliateLinks;