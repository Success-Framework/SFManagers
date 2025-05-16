import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';
import { formatDistanceToNow } from 'date-fns';

const MessagingHome: React.FC = () => {
  const { conversations, fetchConversations, isLoading, error } = useMessages();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (isLoading && conversations.length === 0) {
    return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Messages</h5>
          <div>
            <Link to="/messages/search" className="btn btn-light btn-sm me-2">
              <i className="bi bi-search"></i> Find Users
            </Link>
            <Link to="/messages/new" className="btn btn-light btn-sm">
              <i className="bi bi-pencil"></i> New Message
            </Link>
          </div>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <Link to="/messages" className="nav-link active">
                Inbox
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/messages/sent" className="nav-link">
                Sent
              </Link>
            </li>
            <li className="nav-item ms-auto">
              <Link to="/messages/friends" className="nav-link text-primary">
                <i className="bi bi-people-fill"></i> Friends
              </Link>
            </li>
          </ul>

          {conversations.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <i className="bi bi-inbox fs-1"></i>
              <p className="mt-2">Your inbox is empty</p>
              <p className="small">
                <Link to="/messages/search" className="text-decoration-none">Find users</Link> to start messaging
              </p>
            </div>
          ) : (
            <div className="list-group">
              {conversations.map((conversation) => (
                <Link 
                  key={conversation.userId} 
                  to={`/messages/conversation/${conversation.userId}`}
                  className="list-group-item list-group-item-action d-flex align-items-center"
                >
                  <div className="position-relative me-3">
                    {conversation.userImage ? (
                      <img 
                        src={`/uploads/profiles/${conversation.userImage}`} 
                        alt={conversation.userName} 
                        className="rounded-circle"
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                        style={{ width: '48px', height: '48px' }}
                      >
                        {conversation.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span 
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ marginLeft: '-15px' }}
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <h6 className="mb-0">
                        {conversation.userName}
                        <Link 
                          to={`/messages/profile/${conversation.userId}`} 
                          className="ms-2 text-decoration-none small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <i className="bi bi-info-circle"></i>
                        </Link>
                      </h6>
                      <small className="text-muted">
                        {formatDistanceToNow(new Date(conversation.lastUpdated), { addSuffix: true })}
                      </small>
                    </div>
                    <p className="mb-0 text-truncate small">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingHome; 