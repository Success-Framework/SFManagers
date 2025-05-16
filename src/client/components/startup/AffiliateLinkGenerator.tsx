import React, { useState, useEffect } from 'react';

interface AffiliateLink {
  id: string;
  code: string;
  startupId: string;
  userId: string;
  createdAt: string;
  clicks: number;
  conversions: number;
}

interface AffiliateLinkGeneratorProps {
  startupId: string;
  startupName: string;
}

const AffiliateLinkGenerator: React.FC<AffiliateLinkGeneratorProps> = ({ startupId, startupName }) => {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<AffiliateLink | null>(null);

  useEffect(() => {
    fetchAffiliateLinks();
  }, [startupId]);

  const fetchAffiliateLinks = async () => {
    try {
      const response = await fetch(`/api/startups/${startupId}/affiliate-links`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affiliate links');
      }

      const data = await response.json();
      setLinks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewLink = async () => {
    try {
      const response = await fetch(`/api/startups/${startupId}/affiliate-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate affiliate link');
      }

      const data = await response.json();
      setNewLink(data);
      setLinks(prev => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getFullAffiliateLink = (code: string) => {
    return `${window.location.origin}/startup/${startupId}/affiliate/${code}`;
  };

  return (
    <div className="affiliate-link-generator">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Affiliate Links</h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="mb-4">
            <button 
              className="btn btn-primary"
              onClick={generateNewLink}
              disabled={isLoading}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Generate New Link
            </button>
          </div>

          {isLoading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Link</th>
                    <th>Clicks</th>
                    <th>Conversions</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={getFullAffiliateLink(link.code)}
                            readOnly
                          />
                          <button
                            className="btn btn-sm btn-outline-secondary ms-2"
                            onClick={() => copyToClipboard(getFullAffiliateLink(link.code))}
                          >
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </div>
                      </td>
                      <td>{link.clicks}</td>
                      <td>{link.conversions}</td>
                      <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => copyToClipboard(getFullAffiliateLink(link.code))}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          .affiliate-link-generator {
            margin-top: 2rem;
          }

          .table {
            margin-bottom: 0;
          }

          .table th {
            font-weight: 600;
            background-color: #f8f9fa;
          }

          .form-control {
            font-family: monospace;
          }

          .btn-outline-secondary:hover {
            background-color: #6c757d;
            color: white;
          }
        `}
      </style>
    </div>
  );
};

export default AffiliateLinkGenerator; 