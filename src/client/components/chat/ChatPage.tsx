import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FaUser, FaUsers, FaPlus } from 'react-icons/fa';
import axios from 'axios';

interface Message {
  id: string;
  content: string;
  sender: User;
  receiver?: User;
  groupId?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  members: User[];
}

interface ChatPageProps {
  startupId: string;
  members: User[];
}

const ChatPage: React.FC<ChatPageProps> = ({ startupId, members }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

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

  // Fetch groups on mount and when startupId changes
  useEffect(() => {
    fetchGroups();
  }, [startupId]);

  // Fetch messages when selected user or group changes
  useEffect(() => {
    if (selectedUser || selectedGroup) {
      fetchMessages();
    }
  }, [selectedUser, selectedGroup]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('Fetching groups for startup:', startupId);
      const response = await axios.get(`/api/chat/groups/${startupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Groups fetched successfully:', response.data);
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error('Authentication failed. Please log in again.');
        } else {
          console.error('Server error:', error.response?.data);
        }
      }
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      let url = '/api/chat/messages';
      if (selectedUser) {
        url += `?userId=${selectedUser.id}`;
      } else if (selectedGroup) {
        url += `?groupId=${selectedGroup.id}`;
      }

      console.log('Fetching messages from:', url);
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Messages fetched successfully:', response.data);
      
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
          receiver: msg.receiver_id ? {
            id: msg.receiver_id,
            name: msg.receiver_name,
            email: msg.receiver_email
          } : undefined,
          groupId: msg.groupId,
          createdAt: msg.createdAt
        }))
        .sort((a: Message, b: Message) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      setMessages(transformedMessages);
      // Ensure scroll to bottom after messages are loaded
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.error('Authentication failed. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      if (!selectedUser && !selectedGroup) {
        console.error('No recipient selected');
        return;
      }

      const messageData = {
        content: newMessage,
        receiverId: selectedUser?.id,
        groupId: selectedGroup?.id,
        startupId,
        type: selectedGroup ? 'group' : 'direct'
      };

      console.log('Sending message with data:', messageData);

      const response = await axios.post('/api/chat/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Message sent successfully:', response.data);

      if (response.data) {
        setNewMessage('');
        await fetchMessages();
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.error('Authentication failed. Please log in again.');
        } else {
          const errorMessage = error.response?.data?.message || 'Failed to send message';
          console.error('Server error:', error.response?.data);
          alert(errorMessage);
        }
      }
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedGroup(null);
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  const handleCreateGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      if (!newGroupName.trim() || selectedMembers.length === 0) {
        alert('Please provide a group name and select at least one member');
        return;
      }

      const response = await axios.post('/api/chat/groups', {
        name: newGroupName,
        startupId,
        memberIds: selectedMembers
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Group created successfully:', response.data);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setSelectedMembers([]);
      await fetchGroups(); // Refresh the groups list
    } catch (error) {
      console.error('Error creating group:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to create group';
        alert(errorMessage);
      }
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  return (
    <div className="container-fluid" style={{ height: 'calc(100vh - 60px)' }}>
      <div className="row h-100">
        {/* Sidebar */}
        <div className="col-md-3 border-end h-100" style={{ overflowY: 'auto' }}>
          <div className="d-flex flex-column h-100">
            <div className="p-3 border-bottom">
              <h5>Chat</h5>
            </div>
            
            {/* Direct Messages */}
            <div className="p-3 border-bottom">
              <h6 className="text-muted mb-3">
                <FaUser className="me-2" />
                Direct Messages
              </h6>
              <div className="list-group">
                {members.map(user => (
                  <button
                    key={user.id}
                    className={`list-group-item list-group-item-action ${selectedUser?.id === user.id ? 'active' : ''}`}
                    onClick={() => handleUserSelect(user)}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="col-md-9 h-100 d-flex flex-column" style={{ maxHeight: '100%' }}>
          {/* Chat Header */}
          <div className="p-3 border-bottom bg-white">
            <h5 className="m-0">
              {selectedUser ? `Chat with ${selectedUser.name}` : 
               selectedGroup ? `Group: ${selectedGroup.name}` : 
               'Select a chat'}
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
              <div className="text-center text-muted">No messages yet</div>
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
                  disabled={!selectedUser && !selectedGroup}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!newMessage.trim() || (!selectedUser && !selectedGroup)}
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
