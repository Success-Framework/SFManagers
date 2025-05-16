import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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

interface ChatPageProps {
  startupId: string;
  members: User[];
}

const ChatPage: React.FC<ChatPageProps> = ({ startupId, members }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  // Fetch startup group messages on mount and when startupId changes
  useEffect(() => {
    if (startupId) {
      fetchStartupMessages();
    }
  }, [startupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchStartupMessages = async () => {
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
    
    if (newMessage.trim() !== '') {
      try {
        const messageData = {
          content: newMessage,
          sender: currentUser?.id || '',
          startup_id: startupId
        };
        
        const response = await axios.post(`/api/startups/${startupId}/messages`, messageData);
        
        if (response.status === 201) {
          setMessages(prevMessages => [...prevMessages, response.data]);
          setNewMessage('');
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message. Please try again.');
      }
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        {/* Chat Area */}
        <div className="col-12 h-100 d-flex flex-column">
          {/* Chat Header */}
          <div className="p-3 border-bottom bg-white">
            <h5 className="m-0">
              Team Chat ({members.length} members)
            </h5>
          </div>

          {/* Messages Container */}
          <div 
            className="flex-grow-1 p-3 messages-container"
            style={{ 
              backgroundColor: '#f8f9fa',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0 // This is crucial for flex overflow to work
            }}
          >
            {loading ? (
              <div className="text-center">Loading messages...</div>
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        handleSendMessage(e);
                      }
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add some global styles */}
      <style>{`
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        .messages-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .messages-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
