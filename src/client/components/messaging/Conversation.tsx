import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface UserInfo {
  id: string;
  name: string;
  profileImage?: string;
}

const Conversation: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentConversation, fetchConversation, sendMessage, isLoading, error } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const { token } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation data
  useEffect(() => {
    if (userId) {
      fetchConversation(userId);
      fetchUserDetails();
    }
  }, [userId, fetchConversation]);

  // Scroll to bottom of conversation
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation]);

  // Fetch details of the other user
  const fetchUserDetails = async () => {
    if (!token || !userId) return;

    try {
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOtherUser({
        id: response.data.id,
        name: response.data.name,
        profileImage: response.data.profileImage
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  // Handle sending new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) return;
    
    const success = await sendMessage(userId, newMessage);
    
    if (success) {
      setNewMessage('');
    }
  };

  if (isLoading && currentConversation.length === 0) {
    return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Link to="/messages" className="btn btn-sm btn-light me-3">
              <i className="bi bi-arrow-left"></i>
            </Link>
            <div className="d-flex align-items-center">
              {otherUser?.profileImage ? (
                <img 
                  src={`/uploads/profiles/${otherUser.profileImage}`}
                  alt={otherUser.name}
                  className="rounded-circle me-2"
                  style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="rounded-circle bg-light text-primary d-flex align-items-center justify-content-center me-2"
                  style={{ width: '32px', height: '32px' }}
                >
                  {otherUser?.name.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <h5 className="mb-0">{otherUser?.name || 'Loading...'}</h5>
            </div>
          </div>
        </div>
        
        <div className="card-body conversation-container" style={{ height: '400px', overflowY: 'auto' }}>
          {currentConversation.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="bi bi-chat fs-1"></i>
              <p className="mt-2">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {currentConversation.map((message) => (
                <div 
                  key={message.id}
                  className={`d-flex mb-3 ${message.direction === 'sent' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  {message.direction === 'received' && (
                    <div className="me-2">
                      {otherUser?.profileImage ? (
                        <img 
                          src={`/uploads/profiles/${otherUser.profileImage}`}
                          alt={otherUser?.name}
                          className="rounded-circle"
                          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                        >
                          {otherUser?.name.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div 
                    className={`message-bubble p-2 px-3 rounded-3 ${
                      message.direction === 'sent' 
                        ? 'bg-primary text-white' 
                        : 'bg-light border'
                    }`}
                    style={{ maxWidth: '75%' }}
                  >
                    <div>{message.content}</div>
                    <div className={`text-${message.direction === 'sent' ? 'light' : 'muted'} small`}>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      {message.direction === 'sent' && (
                        <span className="ms-1">
                          {message.read ? <i className="bi bi-check-all"></i> : <i className="bi bi-check"></i>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="card-footer p-3">
          <form onSubmit={handleSendMessage} className="d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <i className="bi bi-send"></i>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Conversation; 