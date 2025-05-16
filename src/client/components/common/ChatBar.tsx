import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import GlobalChatModal from './GlobalChatModal';
import './ChatBar.css';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  unreadCount?: number;
}

interface ChatHead {
  userId: string;
  user: User;
  isOpen: boolean;
  unreadCount: number;
}

const ChatBar: React.FC = () => {
  const { token, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [chatHeads, setChatHeads] = useState<ChatHead[]>([]);
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<Record<string, Date>>({});

  // Load online users
  useEffect(() => {
    if (!token) return;

    const fetchOnlineUsers = async () => {
      try {
        const response = await axios.get('/api/users/online', {
          headers: { 'x-auth-token': token }
        });
        setOnlineUsers(response.data);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();
    // Poll for online users every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Poll for new messages
  useEffect(() => {
    if (!token) return;

    const checkNewMessages = async () => {
      try {
        // Check for new messages for each chat head
        for (const chatHead of chatHeads) {
          // Get last message timestamp for this user
          const lastTime = lastMessageTimeRef.current[chatHead.userId] || new Date(0);
          
          const response = await axios.get(`/api/messages/user/${chatHead.userId}?since=${lastTime.toISOString()}`, {
            headers: { 'x-auth-token': token }
          });
          
          if (response.data.length > 0) {
            // Update last message time
            lastMessageTimeRef.current[chatHead.userId] = new Date(response.data[0].createdAt);
            
            // Update unread count if chat is not open
            if (!chatHead.isOpen) {
              setChatHeads(prevHeads => 
                prevHeads.map(head => 
                  head.userId === chatHead.userId 
                    ? { ...head, unreadCount: head.unreadCount + response.data.length }
                    : head
                )
              );
              
              // Show notification
              const latestMessage = response.data[0];
              if (window.addChatNotification) {
                window.addChatNotification(
                  chatHead.user.firstName + ' ' + chatHead.user.lastName,
                  latestMessage.content,
                  chatHead.user.avatarUrl
                );
              }
              
              // Play sound
              const audio = new Audio('/audio/message-notification.mp3');
              audio.play().catch(err => console.log('Error playing sound', err));
            }
          }
        }
      } catch (error) {
        console.error('Error checking new messages:', error);
      }
    };

    if (chatHeads.length > 0) {
      // Check immediately and then every 3 seconds
      checkNewMessages();
      pollingIntervalRef.current = setInterval(checkNewMessages, 3000);
    } else if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [token, chatHeads]);

  // Add a chat head
  const addChatHead = (user: User) => {
    if (!chatHeads.some(head => head.userId === user.id)) {
      setChatHeads(prev => [...prev, {
        userId: user.id,
        user,
        isOpen: false,
        unreadCount: 0
      }]);
    }
    setIsExpanded(false);
  };

  // Toggle chat head open/closed state
  const toggleChatHead = (userId: string) => {
    setChatHeads(prev => 
      prev.map(head => 
        head.userId === userId
          ? { ...head, isOpen: !head.isOpen, unreadCount: 0 }
          : head
      )
    );

    // Set as active user
    setActiveUserId(userId);
    setShowGlobalChat(true);
  };

  // Remove chat head
  const removeChatHead = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setChatHeads(prev => prev.filter(head => head.userId !== userId));
  };

  // Open global chat
  const handleOpenGlobalChat = () => {
    setShowGlobalChat(true);
    setActiveUserId(null);
  };

  // Close global chat
  const handleCloseGlobalChat = () => {
    setShowGlobalChat(false);
    setActiveUserId(null);
  };

  return (
    <>
      <div className={`chat-bar ${isExpanded ? 'expanded' : ''}`}>
        <div className="chat-bar-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="chat-bar-title">
            <i className="fas fa-comments mr-2"></i>
            <span>Chat</span>
            {onlineUsers.length > 0 && (
              <span className="online-count ml-2">({onlineUsers.length})</span>
            )}
          </div>
          <div className="chat-bar-toggle">
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'up'}`}></i>
          </div>
        </div>
        
        {isExpanded && (
          <div className="chat-bar-content">
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search..." 
                className="form-control form-control-sm" 
              />
            </div>
            
            <div className="online-users-list">
              {onlineUsers.map(user => (
                <div 
                  key={user.id} 
                  className="user-item"
                  onClick={() => addChatHead(user)}
                >
                  <div className="user-avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                    )}
                    <span className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="user-name">
                    {user.firstName} {user.lastName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="chat-heads">
          {chatHeads.map(head => (
            <div 
              key={head.userId}
              className={`chat-head ${head.isOpen ? 'active' : ''}`}
              onClick={() => toggleChatHead(head.userId)}
            >
              <div className="chat-head-avatar">
                {head.user.avatarUrl ? (
                  <img src={head.user.avatarUrl} alt={`${head.user.firstName} ${head.user.lastName}`} />
                ) : (
                  <div className="avatar-placeholder">
                    {head.user.firstName.charAt(0)}{head.user.lastName.charAt(0)}
                  </div>
                )}
                {head.unreadCount > 0 && (
                  <span className="unread-badge">{head.unreadCount}</span>
                )}
              </div>
              <button 
                className="close-chat-head" 
                onClick={(e) => removeChatHead(head.userId, e)}
              >
                &times;
              </button>
            </div>
          ))}
          <div className="chat-head new-chat" onClick={handleOpenGlobalChat}>
            <i className="fas fa-plus"></i>
          </div>
        </div>
      </div>
      
      <GlobalChatModal 
        isOpen={showGlobalChat} 
        onClose={handleCloseGlobalChat}
        initialUserId={activeUserId || undefined}
      />
    </>
  );
};

export default ChatBar; 