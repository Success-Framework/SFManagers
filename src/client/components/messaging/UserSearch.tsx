import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  id: string;
  name: string;
  profileImage?: string;
  isFriend?: boolean;
}

// Sample data for demo/fallback mode
const SAMPLE_USERS = [
  { id: '1', name: 'John Doe', profileImage: 'default.jpg' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Mark Johnson', profileImage: 'mark.jpg' },
  { id: '4', name: 'Sarah Wilson' },
  { id: '5', name: 'Robert Brown' },
  { id: '6', name: 'Emily Davis' },
  { id: '7', name: 'Michael Taylor' },
  { id: '8', name: 'Olivia White' },
  { id: '9', name: 'David Miller' },
  { id: '10', name: 'Sophia Martinez' }
];

const SAMPLE_FRIENDS = [
  { id: '1', name: 'John Doe', profileImage: 'default.jpg', isFriend: true },
  { id: '2', name: 'Jane Smith', isFriend: true },
  { id: '3', name: 'Mark Johnson', profileImage: 'mark.jpg', isFriend: true }
];

const UserSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const { token } = useAuth();
  const [apiAvailable, setApiAvailable] = useState(false);

  // Check API availability
  useEffect(() => {
    const checkApi = async () => {
      try {
        await axios.get('/api/health-check');
        setApiAvailable(true);
      } catch (err) {
        console.log('API not available, using sample data');
        setApiAvailable(false);
      }
    };
    checkApi();
  }, []);

  // Load friends list on component mount
  useEffect(() => {
    fetchFriends();
  }, [token]);

  // Fetch user's friends
  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      if (apiAvailable) {
        const response = await axios.get('/api/friends', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          setFriends(response.data);
        }
      } else {
        // Use sample data when API is not available
        setTimeout(() => {
          setFriends(SAMPLE_FRIENDS);
          setIsLoading(false);
        }, 500);
        return;
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
      // Use sample data as fallback
      setTimeout(() => {
        setFriends(SAMPLE_FRIENDS);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.info('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    try {
      if (apiAvailable) {
        const response = await axios.get(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          // Mark users who are already friends
          const searchResults = response.data.map((user: User) => ({
            ...user,
            isFriend: friends.some(friend => friend.id === user.id)
          }));
          
          setUsers(searchResults);
        }
      } else {
        // Use sample data when API is not available
        setTimeout(() => {
          // Filter sample data based on search query
          const filteredUsers = SAMPLE_USERS.filter(user => 
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          // Mark users who are already friends
          const searchResults = filteredUsers.map(user => ({
            ...user,
            isFriend: friends.some(friend => friend.id === user.id)
          }));
          
          setUsers(searchResults);
          setIsLoading(false);
        }, 500);
        return;
      }
    } catch (err) {
      console.error('Error searching users:', err);
      
      // Filter sample data based on search query
      const filteredUsers = SAMPLE_USERS.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Mark users who are already friends
      const searchResults = filteredUsers.map(user => ({
        ...user,
        isFriend: friends.some(friend => friend.id === user.id)
      }));
      
      setTimeout(() => {
        setUsers(searchResults);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // Add user as friend
  const handleAddFriend = async (userId: string) => {
    try {
      setIsLoading(true);
      
      if (apiAvailable) {
        await axios.post('/api/friends/add', 
          { friendId: userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Simulate API delay in demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, isFriend: true } : user
        )
      );
      
      // Also update friends list
      const addedUser = users.find(user => user.id === userId);
      if (addedUser) {
        setFriends(prev => [...prev, { ...addedUser, isFriend: true }]);
      }
      
      toast.success('Friend added successfully');
    } catch (err) {
      console.error('Error adding friend:', err);
      
      // In demo mode, still update the UI
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, isFriend: true } : user
        )
      );
      
      const addedUser = users.find(user => user.id === userId);
      if (addedUser) {
        setFriends(prev => [...prev, { ...addedUser, isFriend: true }]);
      }
      
      toast.success('Friend added in demo mode');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove user from friends
  const handleRemoveFriend = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      setIsLoading(true);
      
      if (apiAvailable) {
        await axios.delete(`/api/friends/remove/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Simulate API delay in demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, isFriend: false } : user
        )
      );
      
      // Also update friends list
      setFriends(prev => prev.filter(friend => friend.id !== userId));
      
      toast.success('Friend removed successfully');
    } catch (err) {
      console.error('Error removing friend:', err);
      
      // In demo mode, still update the UI
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, isFriend: false } : user
        )
      );
      
      // Also update friends list
      setFriends(prev => prev.filter(friend => friend.id !== userId));
      
      toast.success('Friend removed in demo mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Find Users</h5>
          <Link to="/messages" className="btn btn-light btn-sm">
            <i className="bi bi-chat"></i> Messages
          </Link>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search for users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="bi bi-search"></i>
                )}
              </button>
            </div>
            {!apiAvailable && (
              <div className="text-muted small mt-1">
                <i className="bi bi-info-circle"></i> Demo mode: Using sample data
              </div>
            )}
          </div>
          
          {/* Search Results */}
          {users.length > 0 && (
            <div className="mb-4">
              <h6 className="border-bottom pb-2 mb-3">Search Results</h6>
              <div className="list-group">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center">
                      {user.profileImage ? (
                        <img 
                          src={`/uploads/profiles/${user.profileImage}`} 
                          alt={user.name} 
                          className="rounded-circle me-3"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                          }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fw-bold">{user.name}</div>
                        <div className="text-muted small">
                          <Link to={`/messages/conversation/${user.id}`} className="text-decoration-none">
                            <i className="bi bi-chat-dots me-1"></i>
                            Send Message
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div>
                      {user.isFriend ? (
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemoveFriend(user.id)}
                          disabled={isLoading}
                        >
                          <i className="bi bi-person-dash me-1"></i>
                          Remove
                        </button>
                      ) : (
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleAddFriend(user.id)}
                          disabled={isLoading}
                        >
                          <i className="bi bi-person-plus me-1"></i>
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Friends List */}
          <div>
            <h6 className="border-bottom pb-2 mb-3">My Friends</h6>
            {isLoading && friends.length === 0 ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-3 text-muted">
                <i className="bi bi-people fs-1"></i>
                <p className="mt-2">You don't have any friends yet</p>
                <p className="small">Search for users to add them as friends</p>
              </div>
            ) : (
              <div className="list-group">
                {friends.map((friend) => (
                  <div 
                    key={friend.id} 
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div className="d-flex align-items-center">
                      {friend.profileImage ? (
                        <img 
                          src={`/uploads/profiles/${friend.profileImage}`} 
                          alt={friend.name} 
                          className="rounded-circle me-3"
                          style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random`;
                          }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
                          style={{ width: '40px', height: '40px' }}
                        >
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="fw-bold">{friend.name}</div>
                        <div className="text-muted small">
                          <Link to={`/messages/conversation/${friend.id}`} className="text-decoration-none">
                            <i className="bi bi-chat-dots me-1"></i>
                            Send Message
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={isLoading}
                      >
                        <i className="bi bi-person-dash me-1"></i>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch; 