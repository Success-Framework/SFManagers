import React, { useState, useEffect, useRef } from 'react';
import { Button, Image, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './SimpleChatBar.css';

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read?: boolean;
}

interface ChatWindow {
  userId: string;
  user: User;
  minimized: boolean;
  messages: Message[];
}

const SimpleChatBar: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContacts, setShowContacts] = useState(false);
  const [openChats, setOpenChats] = useState<ChatWindow[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchUsers();
    getCurrentUser();
    
    // Make component visible by adding an animation class
    const chatBarEl = document.querySelector('.simple-chat-bar');
    if (chatBarEl) {
      chatBarEl.classList.add('visible');
    }
    
    // Check for unread messages every 15 seconds
    intervalRef.current = setInterval(() => {
      checkUnreadMessages();
    }, 15000);
    
    // Initial check for unread messages
    checkUnreadMessages();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('/api/users/me', {
        headers: { 'x-auth-token': token }
      });
      
      setCurrentUser({
        id: response.data.id || response.data._id,
        name: response.data.name,
        avatar: response.data.avatar || 'https://via.placeholder.com/36',
        isOnline: true
      });
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Fallback for demo
      setCurrentUser({
        id: 'current-user',
        name: 'Current User',
        avatar: 'https://via.placeholder.com/36',
        isOnline: true
      });
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Try to get friends/contacts first
      let response;
      try {
        response = await axios.get('/api/contacts', {
          headers: { 'x-auth-token': token }
        });
      } catch {
        // Fall back to users if contacts endpoint fails
        response = await axios.get('/api/users', {
          headers: { 'x-auth-token': token }
        });
      }
      
      // Add online status
      const usersWithStatus = response.data.map((user: any) => ({
        id: user.id || user._id,
        name: user.name,
        isOnline: Math.random() > 0.3, // In a real app, this would come from the server
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
      }));
      
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to demo data
      setUsers([
        { id: '1', name: 'Alice Smith', avatar: 'https://ui-avatars.com/api/?name=Alice+Smith&background=random', isOnline: true },
        { id: '2', name: 'Bob Johnson', avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=random', isOnline: true },
        { id: '3', name: 'Carol Williams', avatar: 'https://ui-avatars.com/api/?name=Carol+Williams&background=random', isOnline: false },
        { id: '4', name: 'Dave Brown', avatar: 'https://ui-avatars.com/api/?name=Dave+Brown&background=random', isOnline: true },
        { id: '5', name: 'Eve Davis', avatar: 'https://ui-avatars.com/api/?name=Eve+Davis&background=random', isOnline: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkUnreadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Try two different endpoints that might provide unread message counts
      try {
        const response = await axios.get('/api/messages/unread-count', {
          headers: { 'x-auth-token': token }
        });
        
        if (response.data && typeof response.data.count === 'number') {
          setUnreadMessages(response.data.count);
        } else if (response.data && typeof response.data.unreadCount === 'number') {
          setUnreadMessages(response.data.unreadCount);
        }
      } catch {
        // Try alternative endpoint
        try {
          const response = await axios.get('/api/chat/unread', {
            headers: { 'x-auth-token': token }
          });
          
          if (response.data && (typeof response.data.count === 'number' || typeof response.data.unreadCount === 'number')) {
            setUnreadMessages(response.data.count || response.data.unreadCount);
          }
        } catch (err) {
          console.error('Error checking unread messages from both endpoints:', err);
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  };

  const toggleContacts = () => {
    setShowContacts(prev => !prev);
  };

  const openChat = async (user: User) => {
    // Check if chat is already open
    if (openChats.some(chat => chat.userId === user.id)) {
      // Maximize if it's minimized
      setOpenChats(prevChats => 
        prevChats.map(chat => 
          chat.userId === user.id ? { ...chat, minimized: false } : chat
        )
      );
    } else {
      try {
        // Try to fetch actual messages
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        
        let messages: Message[] = [];
        
        try {
          const response = await axios.get(`/api/messages/conversation/${user.id}`, {
            headers: { 'x-auth-token': token }
          });
          
          if (response.data && Array.isArray(response.data)) {
            messages = response.data.map((msg: any) => ({
              id: msg.id || msg._id,
              senderId: msg.senderId || msg.sender || msg.userId || msg.from,
              content: msg.content || msg.text || msg.message,
              timestamp: msg.timestamp || msg.createdAt || msg.date || new Date().toISOString(),
              read: msg.read || msg.isRead || false
            }));
          }
        } catch {
          // Try alternative endpoint
          try {
            const response = await axios.get(`/api/chat/messages/${user.id}`, {
              headers: { 'x-auth-token': token }
            });
            
            if (response.data && Array.isArray(response.data)) {
              messages = response.data.map((msg: any) => ({
                id: msg.id || msg._id,
                senderId: msg.senderId || msg.sender || msg.userId || msg.from,
                content: msg.content || msg.text || msg.message,
                timestamp: msg.timestamp || msg.createdAt || msg.date || new Date().toISOString(),
                read: msg.read || msg.isRead || false
              }));
            }
          } catch {
            // Fall back to placeholder messages
            messages = [
              {
                id: '1',
                senderId: user.id,
                content: 'Hi there!',
                timestamp: new Date(Date.now() - 3600000).toISOString()
              },
              {
                id: '2',
                senderId: currentUser?.id || 'current-user',
                content: 'Hello! How are you?',
                timestamp: new Date(Date.now() - 3500000).toISOString()
              },
              {
                id: '3',
                senderId: user.id,
                content: 'I am doing well, thank you!',
                timestamp: new Date(Date.now() - 3400000).toISOString()
              }
            ];
          }
        }
        
        // Add new chat window
        setOpenChats(prevChats => [
          ...prevChats,
          {
            userId: user.id,
            user,
            minimized: false,
            messages
          }
        ]);
        
        // Mark messages as read
        if (token) {
          try {
            await axios.post(`/api/messages/mark-read/${user.id}`, {}, {
              headers: { 'x-auth-token': token }
            });
          } catch {
            try {
              await axios.post(`/api/chat/mark-read`, { userId: user.id }, {
                headers: { 'x-auth-token': token }
              });
            } catch (err) {
              console.error('Failed to mark messages as read');
            }
          }
        }
        
      } catch (error) {
        console.error('Error opening chat:', error);
        // Fallback to demo chat
        setOpenChats(prevChats => [
          ...prevChats,
          {
            userId: user.id,
            user,
            minimized: false,
            messages: [
              {
                id: '1',
                senderId: user.id,
                content: 'Hi there!',
                timestamp: new Date(Date.now() - 3600000).toISOString()
              },
              {
                id: '2',
                senderId: currentUser?.id || 'current-user',
                content: 'Hello! How are you?',
                timestamp: new Date(Date.now() - 3500000).toISOString()
              },
              {
                id: '3',
                senderId: user.id,
                content: 'I am doing well, thank you!',
                timestamp: new Date(Date.now() - 3400000).toISOString()
              }
            ]
          }
        ]);
      }
    }
    
    // Hide contacts list
    setShowContacts(false);
    
    // Reset unread messages when opening chat
    checkUnreadMessages();
  };

  const toggleMinimize = (userId: string) => {
    setOpenChats(prevChats => 
      prevChats.map(chat => 
        chat.userId === userId ? { ...chat, minimized: !chat.minimized } : chat
      )
    );
  };

  const closeChat = (userId: string) => {
    setOpenChats(prevChats => prevChats.filter(chat => chat.userId !== userId));
  };

  const sendMessage = async (userId: string, content: string) => {
    if (!content.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      senderId: currentUser?.id || 'current-user',
      content,
      timestamp: new Date().toISOString()
    };
    
    setOpenChats(prevChats => 
      prevChats.map(chat => 
        chat.userId === userId ? {
          ...chat,
          messages: [...chat.messages, newMessage]
        } : chat
      )
    );
    
    // Try to send message to server
    try {
      // Try first endpoint
      try {
        await axios.post(`/api/messages/send`, 
          { to: userId, content },
          { headers: { 'x-auth-token': token } }
        );
      } catch {
        // Try alternative endpoint
        await axios.post(`/api/chat/send`, 
          { userId, message: content },
          { headers: { 'x-auth-token': token } }
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error in UI - replace temporary message with error message
      setOpenChats(prevChats => 
        prevChats.map(chat => 
          chat.userId === userId ? {
            ...chat,
            messages: chat.messages.map(msg => 
              msg.id === tempId ? {
                ...msg,
                content: content + ' (Not sent - tap to retry)',
                error: true
              } : msg
            )
          } : chat
        )
      );
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Flash animation for chat button
  const [flash, setFlash] = useState(false);
  
  useEffect(() => {
    // If there are unread messages, start the flashing animation
    if (unreadMessages > 0) {
      const flashInterval = setInterval(() => {
        setFlash(prev => !prev);
      }, 800);
      
      return () => clearInterval(flashInterval);
    } else {
      setFlash(false);
    }
  }, [unreadMessages]);

  return (
    <div className="simple-chat-bar">
      {/* Main chat bar button */}
      <div className="chat-bar">
        <button 
          className={`chat-toggle-btn ${flash ? 'flash' : ''}`}
          onClick={toggleContacts}
        >
          <i className="fas fa-comments"></i> 
          <span>Contacts</span>
          {unreadMessages > 0 && (
            <Badge 
              bg="danger" 
              className="unread-badge"
            >
              {unreadMessages > 99 ? '99+' : unreadMessages}
            </Badge>
          )}
        </button>
      </div>

      {/* Contacts dropdown */}
      {showContacts && (
        <div className="contacts-dropdown">
          <div className="contacts-header">
            <h6>Contacts ({users.filter(user => user.isOnline).length} online)</h6>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search contacts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="contacts-list">
            {loading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Loading contacts...</span>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className={`contact-item d-flex align-items-center ${user.isOnline ? '' : 'offline'}`}
                  onClick={() => openChat(user)}
                >
                  <div className="position-relative">
                    <Image 
                      src={user.avatar} 
                      roundedCircle 
                      className="contact-avatar" 
                    />
                    {user.isOnline && <div className="online-indicator"></div>}
                  </div>
                  <div className="contact-info">
                    <span className="contact-name">{user.name}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-3">No contacts found</div>
            )}
          </div>
        </div>
      )}

      {/* Open chat windows */}
      <div className="chat-windows">
        {openChats.map(chat => (
          <div key={chat.userId} className={`chat-window ${chat.minimized ? 'minimized' : ''}`}>
            <div className="chat-header" onClick={() => toggleMinimize(chat.userId)}>
              <div className="d-flex align-items-center">
                <div className="position-relative">
                  <Image 
                    src={chat.user.avatar || 'https://via.placeholder.com/32'} 
                    roundedCircle 
                    className="chat-avatar" 
                  />
                  {chat.user.isOnline && <div className="online-indicator"></div>}
                </div>
                <span className="chat-name">{chat.user.name}</span>
              </div>
              <div className="chat-actions">
                <button className="chat-action" onClick={(e) => { e.stopPropagation(); toggleMinimize(chat.userId); }}>
                  {chat.minimized ? '↑' : '↓'}
                </button>
                <button className="chat-action" onClick={(e) => { e.stopPropagation(); closeChat(chat.userId); }}>
                  ✕
                </button>
              </div>
            </div>
            
            {!chat.minimized && (
              <>
                <div className="chat-messages">
                  {chat.messages.length === 0 ? (
                    <div className="text-center py-3 text-muted">
                      <small>No messages yet. Start the conversation!</small>
                    </div>
                  ) : (
                    chat.messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`message ${message.senderId === currentUser?.id || message.senderId === 'current-user' ? 'self' : 'other'}`}
                      >
                        <div className="message-content">
                          <p>{message.content}</p>
                        </div>
                        <span className="message-time">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="chat-input">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        sendMessage(chat.userId, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button 
                    className="send-btn"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input && input.value.trim()) {
                        sendMessage(chat.userId, input.value);
                        input.value = '';
                      }
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleChatBar; 