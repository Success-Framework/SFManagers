import React, { useEffect, useState } from 'react';
import { useMessages } from '../../context/MessageContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const MessageInbox: React.FC = () => {
  const { conversations, currentConversation, fetchConversations, fetchConversation, sendMessage, isLoading } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  
  // Load conversations when component mounts
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token, fetchConversations]);
  
  // Load selected conversation if userId is in URL
  useEffect(() => {
    if (token && userId) {
      fetchConversation(userId);
    }
  }, [token, userId, fetchConversation]);
  
  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) return;
    
    sendMessage(userId, newMessage)
      .then(() => {
        setNewMessage('');
      });
  };
  
  // Sort conversations by last update time
  const sortedConversations = [...conversations].sort((a, b) => 
    b.lastUpdated.getTime() - a.lastUpdated.getTime()
  );
  
  return (
    <div className="container-fluid mt-3 px-4">
      <div className="messenger-container row" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Conversations List (Left sidebar) */}
        <div className="col-md-4 col-lg-3 p-0 border-end" style={{ height: '100%', overflowY: 'auto' }}>
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
            <h5 className="mb-0">Conversations</h5>
            <Link to="/messages/new" className="btn btn-sm btn-primary rounded-circle">
              <i className="bi bi-pencil-fill"></i>
            </Link>
          </div>
          
          <div className="conversation-list">
            {sortedConversations.length === 0 ? (
              <div className="text-center p-4 text-muted">
                <p>No conversations yet</p>
                <Link to="/messages/new" className="btn btn-sm btn-outline-primary">
                  Start a new conversation
                </Link>
              </div>
            ) : (
              sortedConversations.map(conversation => (
                <div 
                  key={conversation.userId}
                  className={`conversation-item d-flex align-items-center p-3 border-bottom ${
                    userId === conversation.userId ? 'bg-light' : ''
                  } ${conversation.unreadCount > 0 ? 'fw-bold' : ''}`}
                  onClick={() => navigate(`/messages/${conversation.userId}`)}
                  style={{ cursor: 'pointer' }}
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
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                        style={{ width: '48px', height: '48px' }}
                      >
                        {conversation.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span 
                        className="position-absolute bottom-0 end-0 badge rounded-pill bg-danger"
                        style={{ fontSize: '0.7rem', transform: 'translate(25%, 25%)' }}
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-truncate">{conversation.userName}</h6>
                      <small className="text-muted ms-2" style={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                        {formatDistanceToNow(conversation.lastUpdated, { addSuffix: false })}
                      </small>
                    </div>
                    <p className="mb-0 text-truncate text-muted" style={{ fontSize: '0.85rem' }}>
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Message Content (Right side) */}
        <div className="col-md-8 col-lg-9 p-0 d-flex flex-column" style={{ height: '100%' }}>
          {!userId ? (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center p-4 text-muted">
              <i className="bi bi-chat-square-text fs-1 mb-3"></i>
              <h5>Select a conversation</h5>
              <p>or start a new one</p>
              <Link to="/messages/new" className="btn btn-primary mt-2">
                New Message
              </Link>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="conversation-header p-3 border-bottom d-flex align-items-center">
                {sortedConversations.find(c => c.userId === userId)?.userImage ? (
                  <img 
                    src={`/uploads/profiles/${sortedConversations.find(c => c.userId === userId)?.userImage}`} 
                    alt="User" 
                    className="rounded-circle me-2"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                    style={{ width: '40px', height: '40px' }}
                  >
                    {sortedConversations.find(c => c.userId === userId)?.userName.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h5 className="mb-0">{sortedConversations.find(c => c.userId === userId)?.userName || 'User'}</h5>
                </div>
              </div>
              
              {/* Messages Area */}
              <div 
                className="conversation-messages p-3 flex-grow-1"
                style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
              >
                {currentConversation.length === 0 ? (
                  <div className="text-center p-4 text-muted mt-auto mb-auto">
                    <i className="bi bi-chat-square-text fs-1 mb-3"></i>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="messages-container">
                    {currentConversation.map(message => (
                      <div 
                        key={message.id}
                        className={`message mb-3 ${message.direction === 'sent' ? 'message-sent ms-auto' : 'message-received me-auto'}`}
                        style={{ maxWidth: '75%' }}
                      >
                        <div 
                          className={`message-bubble p-3 rounded-3 ${
                            message.direction === 'sent' 
                              ? 'bg-primary text-white' 
                              : 'bg-light'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div 
                          className={`message-meta d-flex align-items-center mt-1 ${
                            message.direction === 'sent' ? 'justify-content-end' : ''
                          }`}
                        >
                          <small className="text-muted">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </small>
                          {message.direction === 'sent' && (
                            <small className="ms-2 text-muted">
                              {message.read ? <i className="bi bi-check-all"></i> : <i className="bi bi-check"></i>}
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="message-input p-3 border-top">
                <form onSubmit={handleSendMessage} className="d-flex">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!newMessage.trim() || isLoading}
                  >
                    {isLoading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="bi bi-send-fill"></i>
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInbox; 