import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

// Register all ChartJS components
ChartJS.register(...registerables);

interface AffiliateLink {
  id: string;
  name: string;
  code: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

interface AffiliateClick {
  id: string;
  linkId: string;
  ipAddress: string;
  userAgent: string;
  country: string;
  city: string;
  createdAt: string;
}

interface LinkAnalytics {
  link: AffiliateLink;
  clicks: AffiliateClick[];
  countryData: {
    [key: string]: number;
  };
}

interface AffiliateAnalyticsProps {
  startupId: string;
}

const AffiliateAnalytics: React.FC<AffiliateAnalyticsProps> = ({ startupId }) => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<LinkAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month' | 'year'>('month');

  // Color palette for charts
  const colors = [
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)',
    'rgba(83, 102, 255, 0.6)',
    'rgba(40, 159, 64, 0.6)',
    'rgba(210, 199, 199, 0.6)',
  ];

  useEffect(() => {
    fetchAffiliateAnalytics();
  }, [startupId, timeRange]);

  const fetchAffiliateAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching affiliate links for startup:', startupId);
      console.log('Token:', token.substring(0, 10) + '...');
      
      // Fetch all affiliate links for the startup
      const linksResponse = await axios.get(`/api/affiliate-links/startup/${startupId}`, {
        headers: { 'x-auth-token': token }
      });
      
      const links = linksResponse.data;
      console.log('Received links:', links);
      
      if (links.length === 0) {
        console.log('No links found for this startup');
        setAnalytics([]);
        setLoading(false);
        return;
      }
      
      // For each link, fetch detailed analytics including country information
      console.log('Fetching clicks for each link...');
      const analyticsData: LinkAnalytics[] = await Promise.all(
        links.map(async (link: AffiliateLink) => {
          console.log(`Fetching clicks for link ${link.id} (${link.name})`);
          try {
            const clicksResponse = await axios.get(`/api/affiliate-clicks/${link.id}?timeRange=${timeRange}`, {
              headers: { 'x-auth-token': token }
            });
            
            const clicks = clicksResponse.data;
            console.log(`Received ${clicks.length} clicks for link ${link.id}`);
            
            // Process country data for the link
            const countryData = clicks.reduce((acc: { [key: string]: number }, click: AffiliateClick) => {
              const country = click.country || 'Unknown';
              acc[country] = (acc[country] || 0) + 1;
              return acc;
            }, {});
            
            return {
              link,
              clicks,
              countryData
            };
          } catch (clickErr: any) {
            console.error(`Error fetching clicks for link ${link.id}:`, clickErr);
            // Return minimal data - we don't want to fail the whole analytics if one link fails
            return {
              link,
              clicks: [],
              countryData: {}
            };
          }
        })
      );
      
      console.log('Processed analytics data:', analyticsData.map(d => ({
        linkId: d.link.id,
        clickCount: d.clicks.length
      })));
      
      setAnalytics(analyticsData);
      
      // If there are links and none is selected, select the first one
      if (analyticsData.length > 0 && !selectedLink) {
        setSelectedLink(analyticsData[0].link.id);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching affiliate analytics:', err);
      let errorDetails = '';
      if (err.response) {
        errorDetails = `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`;
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      } else if (err.request) {
        errorDetails = 'No response received from server';
        console.error('Request was made but no response was received');
      } else {
        errorDetails = err.message || 'Unknown error';
      }
      
      const errorMsg = 
        err.response?.data?.error || 
        err.response?.data?.msg || 
        err.message || 
        'Error fetching affiliate analytics';
      setError(`${errorMsg} (${errorDetails})`);
      setLoading(false);
    }
  };

  const getSelectedLinkData = () => {
    return analytics.find(item => item.link.id === selectedLink);
  };

  const getCountryChartData = () => {
    const linkData = getSelectedLinkData();
    
    if (!linkData) return null;
    
    const countries = Object.keys(linkData.countryData);
    const clickCounts = Object.values(linkData.countryData);
    
    return {
      labels: countries,
      datasets: [
        {
          label: 'Clicks by Country',
          data: clickCounts,
          backgroundColor: countries.map((_, i) => colors[i % colors.length]),
          borderWidth: 1
        }
      ]
    };
  };

  const getLinkComparisonData = () => {
    return {
      labels: analytics.map(item => item.link.name),
      datasets: [
        {
          label: 'Total Clicks',
          data: analytics.map(item => item.clicks.length),
          backgroundColor: analytics.map((_, i) => colors[i % colors.length])
        }
      ]
    };
  };

  const getTimeSeriesData = () => {
    const linkData = getSelectedLinkData();
    
    if (!linkData) return null;
    
    // Group clicks by date
    const clicksByDate: { [key: string]: number } = {};
    
    linkData.clicks.forEach(click => {
      const date = new Date(click.createdAt).toISOString().split('T')[0];
      clicksByDate[date] = (clicksByDate[date] || 0) + 1;
    });
    
    // Sort dates
    const sortedDates = Object.keys(clicksByDate).sort();
    
    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Clicks Over Time',
          data: sortedDates.map(date => clicksByDate[date]),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const renderLinkSelector = () => {
    return (
      <div className="mb-4">
        <label htmlFor="link-selector" className="form-label">Select Affiliate Link</label>
        <select
          id="link-selector"
          className="form-select"
          value={selectedLink || ''}
          onChange={(e) => setSelectedLink(e.target.value)}
        >
          {analytics.map(item => (
            <option key={item.link.id} value={item.link.id}>
              {item.link.name} ({item.clicks.length} clicks)
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderTimeRangeSelector = () => {
    return (
      <div className="mb-4">
        <label className="form-label">Time Range</label>
        <div className="btn-group w-100">
          <button 
            className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTimeRange('week')}
          >
            Last Week
          </button>
          <button 
            className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTimeRange('month')}
          >
            Last Month
          </button>
          <button 
            className={`btn ${timeRange === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTimeRange('year')}
          >
            Last Year
          </button>
          <button 
            className={`btn ${timeRange === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center py-4">Loading analytics...</div>;
  
  if (error) return <div className="alert alert-danger">{error}</div>;
  
  if (analytics.length === 0) {
    return (
      <div className="alert alert-info">
        <p>No affiliate links found for this startup.</p>
        <p>Create affiliate links to start tracking analytics.</p>
      </div>
    );
  }

  return (
    <div className="affiliate-analytics-container">
      {renderTimeRangeSelector()}
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card h-100" style={{ maxHeight: '350px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Affiliate Links Comparison</h5>
            </div>
            <div className="card-body" style={{ height: '280px', overflow: 'auto' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Bar 
                  data={getLinkComparisonData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            return `Clicks: ${context.parsed.y}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Clicks'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card h-100" style={{ maxHeight: '350px' }}>
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Link Performance Summary</h5>
            </div>
            <div className="card-body" style={{ height: '280px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Link Name</th>
                      <th>Clicks</th>
                      <th>Countries</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map(item => (
                      <tr 
                        key={item.link.id} 
                        className={item.link.id === selectedLink ? 'table-primary' : ''}
                        onClick={() => setSelectedLink(item.link.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>{item.link.name}</td>
                        <td>{item.clicks.length}</td>
                        <td>{Object.keys(item.countryData).length}</td>
                        <td>{new Date(item.link.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {selectedLink && getSelectedLinkData() && (
        <>
          {renderLinkSelector()}
          
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card h-100" style={{ maxHeight: '350px' }}>
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Clicks by Country</h5>
                </div>
                <div className="card-body" style={{ height: '280px', overflow: 'auto' }}>
                  {getCountryChartData() && Object.keys(getSelectedLinkData()!.countryData).length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Pie 
                        data={getCountryChartData()!} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                boxWidth: 15
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4">No country data available</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card h-100" style={{ maxHeight: '350px' }}>
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">Clicks Over Time</h5>
                </div>
                <div className="card-body" style={{ height: '280px', overflow: 'auto' }}>
                  {getTimeSeriesData() && getSelectedLinkData()!.clicks.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Bar 
                        data={getTimeSeriesData()!} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              display: false
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Number of Clicks'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4">No timeline data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Click Details</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Country</th>
                      <th>City</th>
                      <th>IP Address</th>
                      <th>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSelectedLinkData()!.clicks.length > 0 ? (
                      getSelectedLinkData()!.clicks.map(click => (
                        <tr key={click.id}>
                          <td>{new Date(click.createdAt).toLocaleString()}</td>
                          <td>{click.country || 'Unknown'}</td>
                          <td>{click.city || 'Unknown'}</td>
                          <td>{click.ipAddress}</td>
                          <td>{getUserAgentInfo(click.userAgent)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center">No click data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to extract user agent info
const getUserAgentInfo = (userAgent: string): string => {
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  
  if (userAgent.includes('Chrome')) return `${isMobile ? 'Mobile' : 'Desktop'} Chrome`;
  if (userAgent.includes('Firefox')) return `${isMobile ? 'Mobile' : 'Desktop'} Firefox`;
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return `${isMobile ? 'Mobile' : 'Desktop'} Safari`;
  if (userAgent.includes('Edge')) return `${isMobile ? 'Mobile' : 'Desktop'} Edge`;
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
  
  return isMobile ? 'Mobile Browser' : 'Desktop Browser';
};

export default AffiliateAnalytics;
