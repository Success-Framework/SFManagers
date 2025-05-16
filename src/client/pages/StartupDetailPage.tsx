import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AffiliateLinkGenerator from '../components/startup/AffiliateLinkGenerator';

interface Startup {
  id: string;
  name: string;
  description: string;
  // Add other startup properties as needed
}

const StartupDetailPage: React.FC = () => {
  const { startupId } = useParams<{ startupId: string }>();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const response = await fetch(`/api/startups/${startupId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch startup details');
        }

        const data = await response.json();
        console.log('Fetched startup data:', data); // Debug log
        setStartup(data);
      } catch (err) {
        console.error('Error fetching startup:', err); // Debug log
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (startupId) {
      fetchStartup();
    }
  }, [startupId]);

  console.log('Current startup state:', startup); // Debug log

  return (
    <div className="container py-4">
      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : startup ? (
        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-body">
                <h1 className="card-title">{startup.name}</h1>
                <p className="card-text">{startup.description}</p>
              </div>
            </div>

            {/* Add debug info */}
            <div className="alert alert-info mb-4">
              <p>Startup ID: {startup.id}</p>
              <p>Startup Name: {startup.name}</p>
            </div>

            {/* AffiliateLinkGenerator component */}
            {startup.id && startup.name && (
              <AffiliateLinkGenerator 
                startupId={startup.id}
                startupName={startup.name}
              />
            )}
          </div>
          <div className="col-md-4">
            {/* Sidebar content can go here */}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">
          No startup data available
        </div>
      )}
    </div>
  );
};

export default StartupDetailPage; 