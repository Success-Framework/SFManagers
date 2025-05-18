import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/config';

// Define interfaces
interface ProfileSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface ProfileData {
  id: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  position: string;
  userType: 'investor' | 'employee' | 'freelancer' | 'founder';
  location: string;
  skills: ProfileSkill[];
  bio: string;
  followers: number;
  projects: number;
  availableForHire: boolean;
  hourlyRate?: string;
  availability?: string;
  rating: number;
  joinDate: string;
}

// User type options
const userTypeOptions = [
  { label: 'Investors', value: 'investor' },
  { label: 'Employees', value: 'employee' },
  { label: 'Freelancers', value: 'freelancer' },
  { label: 'Founders', value: 'founder' },
];

// Common position options
const positionOptions = [
  { label: 'Development', value: 'developer' },
  { label: 'Design', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Management', value: 'management' },
  { label: 'Finance', value: 'finance' },
];

const Profiles: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Fetch profiles from the API
  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      setError(null);
      
      // Track retry attempts
      let retryCount = 0;
      const maxRetries = 2;
      
      const attemptFetch = async () => {
        try {
          console.log('Fetching profiles, attempt:', retryCount + 1);
          
          // Build query parameters
          const params = new URLSearchParams();
          if (selectedUserTypes.length > 0) {
            params.append('userType', selectedUserTypes.join(','));
          }
          if (selectedPositions.length > 0) {
            params.append('position', selectedPositions.join(','));
          }
          if (availableOnly) {
            params.append('available', 'true');
          }
          
          // Make the real API call
          console.log('API request URL:', `${API_BASE_URL}/profiles?${params.toString()}`);
          
          const response = await axios.get(`${API_BASE_URL}/profiles?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-auth-token': token || ''
            },
            // Add timeout to prevent hanging requests
            timeout: 10000
          });
          
          console.log('API response status:', response.status);
          console.log('API response data:', response.data);
          
          if (response.status !== 200) {
            throw new Error(`Failed to fetch profiles: ${response.status}`);
          }
          
          // Validate and process the data
          if (!response.data || !Array.isArray(response.data.profiles)) {
            console.error('Invalid data format received:', response.data);
            throw new Error('Invalid data format received from server');
          }
          
          // Set profiles from the API response
          setProfiles(response.data.profiles || []);
          setFilteredProfiles(response.data.profiles || []);
          setIsLoading(false);
          
        } catch (err: unknown) {
          console.error('Error fetching profiles:', err);
          
          // Check if we should retry
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying fetch, attempt ${retryCount + 1} of ${maxRetries + 1}`);
            // Exponential backoff: 1s, 2s, 4s, etc.
            const delay = 1000 * Math.pow(2, retryCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptFetch();
          }
          
          // If all retries failed, show error and use the mock data as fallback
          let errorMessage = 'Failed to load profiles';
          
          // Try to extract error message from different error types
          if (err instanceof Error) {
            errorMessage = err.message;
          } else if (err && typeof err === 'object') {
            // Handle axios error response
            if ('response' in err && 
                err.response && 
                typeof err.response === 'object' && 
                'data' in err.response && 
                err.response.data && 
                typeof err.response.data === 'object' && 
                'error' in err.response.data) {
              errorMessage = String(err.response.data.error);
            }
          }
          
          setError(`${errorMessage}. Please try again later.`);
          
          // Use mock data as fallback
          const mockProfiles: ProfileData[] = [
            {
              id: '1',
              fullName: 'John Developer',
              avatarUrl: '',
              email: 'john@example.com',
              position: 'Full Stack Developer',
              userType: 'freelancer' as 'freelancer',
              location: 'San Francisco, CA',
              skills: [{ name: 'React', level: 'expert' as 'expert' }, { name: 'Node.js', level: 'advanced' as 'advanced' }],
              bio: 'Passionate developer with 5+ years of experience building web applications.',
              followers: 120,
              projects: 15,
              availableForHire: true,
              hourlyRate: '$80',
              rating: 4.8,
              joinDate: '2023-01-15'
            },
            {
              id: '2',
              fullName: 'Sarah Designer',
              avatarUrl: '',
              email: 'sarah@example.com',
              position: 'UI/UX Designer',
              userType: 'employee' as 'employee',
              location: 'New York, NY',
              skills: [{ name: 'Figma', level: 'expert' as 'expert' }, { name: 'UI Design', level: 'expert' as 'expert' }],
              bio: 'Creative designer focused on creating beautiful and functional user interfaces.',
              followers: 85,
              projects: 23,
              availableForHire: false,
              rating: 4.6,
              joinDate: '2022-11-05'
            }
          ];
          
          console.log('Using fallback mock data');
          setProfiles(mockProfiles);
          setFilteredProfiles(mockProfiles);
          setIsLoading(false);
        }
      };
      
      attemptFetch();
    };
    
    fetchProfiles();
  }, [selectedUserTypes, selectedPositions, availableOnly, token]);

  // Apply local search filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProfiles(profiles);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = profiles.filter(profile => 
      profile.fullName.toLowerCase().includes(query) ||
      profile.position.toLowerCase().includes(query) ||
      profile.bio.toLowerCase().includes(query) ||
      profile.location.toLowerCase().includes(query) ||
      profile.skills.some(skill => skill.name.toLowerCase().includes(query))
    );
    
    setFilteredProfiles(filtered);
  }, [searchQuery, profiles]);

  // When error occurs in profile loading
  useEffect(() => {
    if (error && profiles.length > 0) {
      // If we have fallback data but an error occurred
      setError('Could not connect to server. Showing sample data instead.');
    }
  }, [error, profiles]);

  const handleUserTypeChange = (value: string) => {
    setSelectedUserTypes(current => {
      if (current.includes(value)) {
        return current.filter(type => type !== value);
      } else {
        return [...current, value];
      }
    });
  };

  const handlePositionChange = (value: string) => {
    setSelectedPositions(current => {
      if (current.includes(value)) {
        return current.filter(pos => pos !== value);
      } else {
        return [...current, value];
      }
    });
  };

  const clearFilters = () => {
    setSelectedUserTypes([]);
    setSelectedPositions([]);
    setAvailableOnly(false);
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    return selectedUserTypes.length + selectedPositions.length + (availableOnly ? 1 : 0);
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-secondary text-dark';
      case 'intermediate':
        return 'bg-info text-dark';
      case 'advanced':
        return 'bg-primary text-white';
      case 'expert':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary text-dark';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'investor':
        return 'bg-success text-white';
      case 'employee':
        return 'bg-info text-white';
      case 'freelancer':
        return 'bg-primary text-white';
      case 'founder':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary text-white';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-lg-6 mb-3 mb-lg-0">
                  <h5 className="mb-0">Find Professional Talent</h5>
                  <p className="text-muted mb-0">
                    Connect with {profiles.length} professionals across different fields
                  </p>
                </div>
                <div className="col-lg-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="fa fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by name, skill, position..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-3 mb-4 mb-lg-0">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Filters</h6>
                {getActiveFilterCount() > 0 && (
                  <button onClick={clearFilters} className="btn btn-sm btn-outline-secondary">
                    Clear all
                  </button>
                )}
              </div>

              <div className="mb-4">
                <h6 className="text-muted text-uppercase small mb-3">Professional Type</h6>
                {userTypeOptions.map((option) => (
                  <div className="form-check mb-2" key={option.value}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`userType-${option.value}`}
                      checked={selectedUserTypes.includes(option.value)}
                      onChange={() => handleUserTypeChange(option.value)}
                    />
                    <label className="form-check-label" htmlFor={`userType-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <h6 className="text-muted text-uppercase small mb-3">Position</h6>
                {positionOptions.map((option) => (
                  <div className="form-check mb-2" key={option.value}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`position-${option.value}`}
                      checked={selectedPositions.includes(option.value)}
                      onChange={() => handlePositionChange(option.value)}
                    />
                    <label className="form-check-label" htmlFor={`position-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>

              <div>
                <h6 className="text-muted text-uppercase small mb-3">Availability</h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="availableForHire"
                    checked={availableOnly}
                    onChange={() => setAvailableOnly(!availableOnly)}
                  />
                  <label className="form-check-label" htmlFor="availableForHire">
                    Available for hire only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          {isLoading ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-warning" role="alert">
              <div className="d-flex align-items-center">
                <i className="fa fa-exclamation-triangle me-2"></i>
                <div>
                  <strong>Connection issue:</strong> {error}
                  {profiles.length > 0 && (
                    <div className="mt-2 small">
                      <i>Showing sample profiles for demonstration</i>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="fa fa-search fa-3x text-muted mb-3"></i>
                <h5>No profiles found</h5>
                <p className="text-muted">
                  Try adjusting your search or filter criteria to find more professionals.
                </p>
                <button onClick={clearFilters} className="btn btn-outline-primary">
                  Clear all filters
                </button>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredProfiles.map((profile) => (
                <div className="col-md-6 col-xl-4 mb-4" key={profile.id}>
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body p-4">
                      <Link 
                        to={`/profiles/${profile.id}`} 
                        className="text-decoration-none text-inherit"
                      >
                        <div className="d-flex align-items-center mb-3">
                          {profile.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt={profile.fullName}
                              className="rounded-circle me-3"
                              width="50"
                              height="50"
                            />
                          ) : (
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: 50,
                                height: 50,
                                backgroundColor: '#f0f2f5',
                                color: '#6c757d',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {getInitials(profile.fullName)}
                            </div>
                          )}
                          <div>
                            <h6 className="mb-0">{profile.fullName}</h6>
                            <div className="text-muted small">{profile.position}</div>
                          </div>
                        </div>
                      </Link>

                      <div className="mb-3">
                        <span
                          className={`badge ${getUserTypeBadgeColor(profile.userType)} me-2`}
                        >
                          {profile.userType.charAt(0).toUpperCase() + profile.userType.slice(1)}
                        </span>
                        {profile.availableForHire && (
                          <span className="badge bg-success text-white">Available</span>
                        )}
                      </div>

                      <div className="small text-muted mb-3">
                        <i className="fa fa-map-marker-alt me-2"></i>
                        {profile.location}
                      </div>

                      <p className="small text-muted mb-3" style={{ minHeight: '3rem' }}>
                        {profile.bio.length > 100
                          ? `${profile.bio.substring(0, 100)}...`
                          : profile.bio}
                      </p>

                      <div className="mb-3">
                        <div className="d-flex flex-wrap gap-1">
                          {profile.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className={`badge ${getSkillLevelColor(skill.level)} me-1 mb-1`}
                            >
                              {skill.name}
                            </span>
                          ))}
                          {profile.skills.length > 3 && (
                            <span className="badge bg-light text-dark me-1 mb-1">
                              +{profile.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between small text-muted">
                        <div>
                          <i className="fa fa-star text-warning me-1"></i>
                          {profile.rating.toFixed(1)}
                        </div>
                        <div>
                          <i className="fa fa-user me-1"></i>
                          {profile.followers} followers
                        </div>
                        <div>
                          <i className="fa fa-briefcase me-1"></i>
                          {profile.projects} projects
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-white p-3 border-top d-flex justify-content-between">
                      {profile.userType === 'freelancer' && profile.hourlyRate && (
                        <div className="small">
                          <span className="fw-bold">{profile.hourlyRate}</span> / hour
                        </div>
                      )}
                      <Link to={`/profiles/${profile.id}`} className="btn btn-sm btn-primary">
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profiles; 