import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
  id: string;
  name: string;
  profileImage?: string;
}

// Sample users for demo mode
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

const ComposeMessage: React.FC = () => {
  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { sendMessage, isLoading, error } = useMessages();
  const { token } = useAuth();
  const navigate = useNavigate();
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

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;

      setIsLoadingUsers(true);
      try {
        if (apiAvailable) {
          const response = await axios.get('/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUsers(response.data);
        } else {
          // Use sample data in demo mode
          setTimeout(() => {
            setUsers(SAMPLE_USERS);
            setIsLoadingUsers(false);
          }, 500);
          return;
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        // Use sample data as fallback
        setTimeout(() => {
          setUsers(SAMPLE_USERS);
        }, 500);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [token, apiAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receiverId || !content.trim()) {
      toast.error('Please select a recipient and enter a message');
      return;
    }
    
    const success = await sendMessage(receiverId, content);
    
    if (success) {
      toast.success('Message sent successfully');
      navigate(`/messages/conversation/${receiverId}`);
    } else if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Link to="/messages" className="btn btn-sm btn-light me-3">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <h5 className="mb-0">New Message</h5>
          </div>
        </div>
        
        <div className="card-body">
          {!apiAvailable && (
            <div className="alert alert-info mb-3">
              <i className="bi bi-info-circle me-2"></i>
              Demo mode: Using sample data
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="recipient" className="form-label">Recipient</label>
              <select 
                id="recipient" 
                className="form-select"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                required
              >
                <option value="">Select a recipient...</option>
                {isLoadingUsers ? (
                  <option disabled>Loading users...</option>
                ) : users.length === 0 ? (
                  <option disabled>No users found</option>
                ) : (
                  users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="mb-3">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea
                id="message"
                className="form-control"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message here..."
                required
              ></textarea>
            </div>
            
            <div className="d-flex justify-content-between">
              <Link to="/messages" className="btn btn-outline-secondary">
                Cancel
              </Link>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading || !receiverId || !content.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComposeMessage; 