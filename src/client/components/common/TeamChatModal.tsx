import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface Message {
  id: string;
  content: string;
  sender: User;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface TeamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  startupId: string | null;
}

const TeamChatModal: React.FC<TeamChatModalProps> = ({ isOpen, onClose, startupId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch members when startup ID changes
  useEffect(() => {
    if (startupId) {
      fetchStartupMembers();
    }
  }, [startupId]);

  // Fetch messages when startup ID changes and modal is open
  useEffect(() => {
    if (startupId && isOpen) {
      fetchStartupMessages();
    }
  }, [startupId, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchStartupMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !startupId) return;

      const response = await axios.get(`/api/startups/${startupId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error('Error fetching startup members:', error);
    }
  };

  const fetchStartupMessages = async () => {
    if (!startupId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      // Create or get the startup group
      const groupResponse = await axios.get(`/api/chat/groups/${startupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let groupId;
      if (groupResponse.data && groupResponse.data.length > 0) {
        // Use existing group
        groupId = groupResponse.data[0].id;
      } else {
        // Create a startup team group
        const createGroupResponse = await axios.post('/api/chat/groups', {
          name: 'Team Chat',
          startupId,
          memberIds: members.map(member => member.id)
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        groupId = createGroupResponse.data.id;
      }

      // Get messages for the group
      const url = `/api/chat/messages?groupId=${groupId}`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transform and sort messages by timestamp
      const transformedMessages = response.data
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: {
            id: msg.sender_id,
            name: msg.sender_name,
            email: msg.sender_email
          },
          createdAt: msg.createdAt
        }))
        .sort((a: Message, b: Message) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      setMessages(transformedMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching startup messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !startupId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      // Get or create the group
      const groupResponse = await axios.get(`/api/chat/groups/${startupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let groupId;
      if (groupResponse.data && groupResponse.data.length > 0) {
        // Use existing group
        groupId = groupResponse.data[0].id;
      } else {
        // Create a startup team group
        const createGroupResponse = await axios.post('/api/chat/groups', {
          name: 'Team Chat',
          startupId,
          memberIds: members.map(member => member.id)
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        groupId = createGroupResponse.data.id;
      }

      const messageData = {
        content: newMessage,
        groupId,
        startupId,
        type: 'group'
      };

      await axios.post('/api/chat/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNewMessage('');
      await fetchStartupMessages();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop show">
      <div 
        className="modal show d-block" 
        tabIndex={-1}
        role="dialog"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content" ref={modalRef}>
            <div className="modal-header">
              <h5 className="modal-title">
                Team Chat {members.length > 0 && `(${members.length} members)`}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div 
              className="modal-body p-0"
              style={{ 
                height: '400px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Messages Container */}
              <div 
                className="flex-grow-1 p-3 messages-container"
                style={{ 
                  backgroundColor: '#f8f9fa',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '350px'
                }}
              >
                {loading ? (
                  <div className="text-center">Loading messages...</div>
                ) : !startupId ? (
                  <div className="text-center text-muted">Please navigate to a startup to use team chat.</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted">No messages yet. Start the team conversation!</div>
                ) : (
                  <div style={{ marginTop: 'auto' }}>
                    {messages.map(message => {
                      const isCurrentUser = message.sender.id === currentUser?.id;
                      return (
                        <div
                          key={message.id}
                          className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                          <div 
                            className={`message-bubble rounded p-3 ${
                              isCurrentUser ? 'bg-primary text-white' : 'bg-white border'
                            }`}
                            style={{ 
                              maxWidth: '70%',
                              position: 'relative'
                            }}
                          >
                            <div className="small mb-1" style={{ opacity: 0.8 }}>
                              {message.sender.name}
                            </div>
                            <div style={{ wordBreak: 'break-word' }}>
                              {message.content}
                            </div>
                            <div 
                              className="small mt-1" 
                              style={{ opacity: 0.8 }}
                            >
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-3 border-top bg-white">
                <form onSubmit={handleSendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={!startupId}
                    />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={!newMessage.trim() || !startupId}
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChatModal; 