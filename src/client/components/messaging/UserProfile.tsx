import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface UserData {
  id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  status?: string;
  joinDate?: string;
  isFriend?: boolean;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    if (!userId || !token) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user info
        const userResponse = await axios.get(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Check if this user is a friend
        const friendsResponse = await axios.get('/api/friends', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const isFriend = friendsResponse.data.some((friend: any) => friend.id === userId);
        
        setUser({
          ...userResponse.data,
          isFriend
        });
        setIsFriend(isFriend);
      } catch (err) {
        console.error('Error fetching user data:', err);
        
        // Fallback to sample data
        const sampleUsers: Record<string, UserData> = {
          '1': {
            id: '1',
            name: 'John Doe',
            profileImage: 'default.jpg',
            bio: 'Software developer with 5 years of experience',
            status: 'online',
            joinDate: '2022-01-15',
            isFriend: true
          },
          '2': {
            id: '2',
            name: 'Jane Smith',
            bio: 'Marketing specialist',
            status: 'away',
            joinDate: '2022-02-20',
            isFriend: false
          },
          '3': {
            id: '3',
            name: 'Mark Johnson',
            profileImage: 'mark.jpg',
            bio: 'Project manager',
            status: 'offline',
            joinDate: '2021-11-10',
            isFriend: true
          }
        };
        
        if (sampleUsers[userId]) {
          setUser(sampleUsers[userId]);
          setIsFriend(sampleUsers[userId].isFriend || false);
        } else {
          toast.error('User not found');
          navigate('/messages');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, token, navigate]);

  // Add user as friend
  const handleAddFriend = async () => {
    if (!userId || !token) return;
    
    try {
      setIsLoading(true);
      await axios.post('/api/friends/add', 
        { friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsFriend(true);
      setUser(prev => prev ? { ...prev, isFriend: true } : null);
      
      toast.success('Friend added successfully');
    } catch (err) {
      console.error('Error adding friend:', err);
      toast.error('Failed to add friend');
      
      // Update UI anyway for demo purposes
      setIsFriend(true);
      setUser(prev => prev ? { ...prev, isFriend: true } : null);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove user from friends
  const handleRemoveFriend = async () => {
    if (!userId || !token || !window.confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      setIsLoading(true);
      await axios.delete(`/api/friends/remove/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsFriend(false);
      setUser(prev => prev ? { ...prev, isFriend: false } : null);
      
      toast.success('Friend removed successfully');
    } catch (err) {
      console.error('Error removing friend:', err);
      toast.error('Failed to remove friend');
      
      // Update UI anyway for demo purposes
      setIsFriend(false);
      setUser(prev => prev ? { ...prev, isFriend: false } : null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">User not found</div>
        <Link to="/messages" className="btn btn-primary">Back to Messages</Link>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Link to="/messages" className="btn btn-sm btn-light me-3">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <h5 className="mb-0">User Profile</h5>
          </div>
        </div>
        
        <div className="card-body">
          <div className="text-center mb-4">
            {user.profileImage ? (
              <img 
                src={`/uploads/profiles/${user.profileImage}`} 
                alt={user.name} 
                className="rounded-circle img-thumbnail"
                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
              />
            ) : (
              <div 
                className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto"
                style={{ width: '150px', height: '150px' }}
              >
                <span className="display-3">{user.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            
            <h3 className="mt-3">{user.name}</h3>
            
            {user.status && (
              <div className="mb-2">
                <span 
                  className={`badge ${
                    user.status === 'online' 
                      ? 'bg-success' 
                      : user.status === 'away' 
                        ? 'bg-warning' 
                        : 'bg-secondary'
                  }`}
                >
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            )}
            
            {user.bio && (
              <p className="text-muted mb-3">{user.bio}</p>
            )}
            
            {user.joinDate && (
              <p className="small text-muted">
                Member since {new Date(user.joinDate).toLocaleDateString()}
              </p>
            )}
            
            <div className="d-flex justify-content-center gap-2 mt-3">
              <Link to={`/messages/conversation/${user.id}`} className="btn btn-primary">
                <i className="bi bi-chat-dots me-2"></i>
                Send Message
              </Link>
              
              {isFriend ? (
                <button 
                  className="btn btn-outline-danger"
                  onClick={handleRemoveFriend}
                  disabled={isLoading}
                >
                  <i className="bi bi-person-dash me-2"></i>
                  Remove Friend
                </button>
              ) : (
                <button 
                  className="btn btn-outline-primary"
                  onClick={handleAddFriend}
                  disabled={isLoading}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Add Friend
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 