import React, { useEffect } from 'react';
import { useMessages } from '../../context/MessageContext';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Extend the Message interface for display in sent messages list
interface SentMessageWithReceiver {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  receiverId: string; // Alias for recipientId for clarity
  receiverName?: string;
  receiverProfileImage?: string;
  createdAt: string;
  read: boolean;
  direction: 'sent' | 'received';
}

const SentMessages: React.FC = () => {
  const { sentMessages, fetchSent, isLoading, error, deleteMessage } = useMessages();
  
  useEffect(() => {
    fetchSent();
  }, [fetchSent]);

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      await deleteMessage(messageId);
    }
  };

  if (isLoading && sentMessages.length === 0) {
    return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Transform messages for display
  const displayMessages: SentMessageWithReceiver[] = sentMessages.map(message => ({
    ...message,
    receiverId: message.recipientId,
    receiverName: message.recipientId, // Fallback to ID if name not available
    receiverProfileImage: undefined // Default to no image
  }));

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Messages</h5>
          <Link to="/messages/new" className="btn btn-light btn-sm">
            <i className="bi bi-pencil"></i> New Message
          </Link>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <Link to="/messages" className="nav-link">
                Inbox
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/messages/sent" className="nav-link active">
                Sent
              </Link>
            </li>
          </ul>

          {displayMessages.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="bi bi-cursor-text fs-1"></i>
              <p className="mt-2">You haven't sent any messages yet</p>
            </div>
          ) : (
            <div className="list-group">
              {displayMessages.map((message) => (
                <div 
                  key={message.id} 
                  className="list-group-item list-group-item-action d-flex"
                >
                  <div className="me-3">
                    {message.receiverProfileImage ? (
                      <img 
                        src={`/uploads/profiles/${message.receiverProfileImage}`} 
                        alt={message.receiverName || 'User'} 
                        className="rounded-circle"
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px' }}
                      >
                        {message.receiverName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <Link to={`/messages/conversation/${message.receiverId}`} className="fw-bold text-decoration-none">
                        {message.receiverName || 'Unknown User'}
                      </Link>
                      <small className="text-muted">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </small>
                    </div>
                    <p className="mb-1 text-truncate">
                      <span className="text-secondary me-1">To:</span>
                      {message.content}
                    </p>
                    <small className="text-muted">
                      {message.read ? 'Read' : 'Not read yet'}
                    </small>
                  </div>
                  <div className="ms-2">
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteMessage(message.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
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

export default SentMessages; 