import React from 'react';
import { MoreVertical, Reply, Edit3, Trash2, Copy } from 'lucide-react';

const MessageList = ({ 
  messages, 
  currentUser, 
  loading, 
  typingUsers, 
  chatType,
  messagesEndRef 
}) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const shouldGroupMessage = (currentMsg, prevMsg) => {
    if (!prevMsg) return false;
    if (currentMsg.senderId !== prevMsg.senderId) return false;
    
    const timeDiff = new Date(currentMsg.createdAt) - new Date(prevMsg.createdAt);
    return timeDiff < 5 * 60 * 1000; // Group messages within 5 minutes
  };

  const handleMessageAction = (action, message) => {
    switch (action) {
      case 'reply':
        // Handle reply functionality
        console.log('Reply to message:', message);
        break;
      case 'edit':
        // Handle edit functionality
        console.log('Edit message:', message);
        break;
      case 'delete':
        // Handle delete functionality
        console.log('Delete message:', message);
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      default:
        break;
    }
  };

  const MessageActions = ({ message, isOwn }) => (
    <div className="message-actions">
      <button
        className="message-action-btn"
        onClick={() => handleMessageAction('reply', message)}
        title="Reply"
      >
        <Reply size={14} />
      </button>
      <button
        className="message-action-btn"
        onClick={() => handleMessageAction('copy', message)}
        title="Copy"
      >
        <Copy size={14} />
      </button>
      {isOwn && (
        <>
          <button
            className="message-action-btn"
            onClick={() => handleMessageAction('edit', message)}
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            className="message-action-btn delete"
            onClick={() => handleMessageAction('delete', message)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
      <button className="message-action-btn">
        <MoreVertical size={14} />
      </button>
    </div>
  );

  const TypingIndicator = () => (
    <div className="typing-indicator">
      <div className="typing-avatar">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="typing-text">
        {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="messages-container">
        <div className="loading-messages">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-content">
              <div className="no-messages-icon">💬</div>
              <h3>Start the conversation</h3>
              <p>Send a message to get things started</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isOwn = message.senderId === currentUser.id;
            const isGrouped = shouldGroupMessage(message, prevMessage);
            const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
            const senderName = chatType === 'group' ? message.sender_name : '';

            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && (
                  <div className="date-separator">
                    <span className="date-text">{formatDate(message.createdAt)}</span>
                  </div>
                )}
                
                <div className={`message-wrapper ${isOwn ? 'own' : 'other'} ${isGrouped ? 'grouped' : ''}`}>
                  {!isGrouped && !isOwn && (
                    <div className="message-avatar">
                      <div className="user-avatar">
                        {(senderName || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  <div className="message-content">
                    {!isGrouped && chatType === 'group' && !isOwn && (
                      <div className="message-sender">
                        <span className="sender-name">{senderName}</span>
                        <span className="message-time">{formatTime(message.createdAt)}</span>
                      </div>
                    )}
                    
                    <div className="message-bubble">
                      <div className="message-text">{message.content}</div>
                      
                      {!isGrouped && (chatType === 'direct' || isOwn) && (
                        <div className="message-meta">
                          <span className="message-time">{formatTime(message.createdAt)}</span>
                          {isOwn && (
                            <span className="message-status">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <MessageActions message={message} isOwn={isOwn} />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {typingUsers.size > 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;