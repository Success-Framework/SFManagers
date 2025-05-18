import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, ListGroup, Form, Button, Tabs, Tab, Nav, Badge } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Define types for the group chat data
interface GroupChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  userName: string;
  content: string;
  createdAt: string;
  userImage?: string;
  isRead?: boolean;
}

interface GroupChatRoom {
  id: string;
  name: string;
  description: string;
  messageCount: number;
  lastActivity: string;
  isProject?: boolean;
  projectId?: string;
  unreadCount: number;
  memberCount?: number;
}

interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  unreadCount?: number;
}

interface GroupMember {
  id: string;
  name: string;
  profileImage?: string;
  isAdmin: boolean;
  joinedAt: string;
}

type TabKey = 'inbox' | 'groups' | 'general' | 'friends';

const GroupChat: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // State for tabs and chat rooms/messages
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [chatRooms, setChatRooms] = useState<GroupChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<GroupChatRoom | null>(null);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [friends, setFriends] = useState<ChatContact[]>([]);
  const [privateConversations, setPrivateConversations] = useState<GroupChatRoom[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Reference to automatically scroll messages
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Sample data for fallback when API fails
  const sampleGroupChats: GroupChatRoom[] = [
    {
      id: 'sample-general-1',
      name: 'General Discussion',
      description: 'General chat for all users',
      messageCount: 24,
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      memberCount: 12
    },
    {
      id: 'sample-general-2',
      name: 'Help & Support',
      description: 'Get help with the platform',
      messageCount: 5,
      lastActivity: new Date().toISOString(),
      unreadCount: 0,
      memberCount: 8
    }
  ];

  const sampleProjectChats: GroupChatRoom[] = [
    {
      id: 'sample-project-1',
      name: 'Project Alpha',
      description: 'Discussion for Project Alpha',
      messageCount: 18,
      lastActivity: new Date().toISOString(),
      isProject: true,
      projectId: 'sample-1',
      unreadCount: 0,
      memberCount: 5
    },
    {
      id: 'sample-project-2',
      name: 'Marketing Campaign',
      description: 'Planning for Q4 marketing',
      messageCount: 32,
      lastActivity: new Date().toISOString(),
      isProject: true,
      projectId: 'sample-2',
      unreadCount: 0,
      memberCount: 7
    }
  ];

  const sampleMessages: GroupChatMessage[] = [
    {
      id: 'sample-msg-1',
      groupId: 'sample-general-1',
      senderId: 'sample-user-1',
      userName: 'System Bot',
      content: 'Welcome to the chat! This is a sample message since we could not load real messages.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isRead: true
    },
    {
      id: 'sample-msg-2',
      groupId: 'sample-general-1',
      senderId: 'admin',
      userName: 'Admin',
      content: 'Please try refreshing the page if you continue to see sample data.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      isRead: true
    }
  ];
  
  // Function to fetch group chats from the API
  const fetchGroupChats = async () => {
    if (!token) {
      return;
    }
    
    try {
      const response = await axios.get('/api/messages/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const formattedGroups = response.data.map((group: any) => ({
          id: group.id,
          name: group.name,
          description: group.description || '',
          messageCount: group.messageCount || 0,
          lastActivity: group.lastActivity || new Date().toISOString(),
          isProject: group.isProject || false,
          projectId: group.projectId || null,
          unreadCount: group.unreadCount || 0,
          memberCount: group.memberCount || 1
        }));
        
        // Filter groups by whether they are projects or general discussions
        const generalGroups = formattedGroups.filter(g => !g.isProject);
        const projectGroups = formattedGroups.filter(g => g.isProject);
        
        if (activeTab === 'general') {
          setChatRooms(generalGroups);
          // Set the first general group as selected if none is selected
          if (!selectedRoom || !generalGroups.find(g => g.id === selectedRoom.id)) {
            setSelectedRoom(generalGroups.length > 0 ? generalGroups[0] : null);
          }
        } else if (activeTab === 'groups') {
          setChatRooms(projectGroups);
          // Set the first project group as selected if none is selected
          if (!selectedRoom || !projectGroups.find(g => g.id === selectedRoom.id)) {
            setSelectedRoom(projectGroups.length > 0 ? projectGroups[0] : null);
          }
        }
        
        setApiError(null);
      } else {
        console.error('Unexpected response format:', response.data);
        setApiError('Failed to load group chats');
        
        // Use sample data as fallback
        if (activeTab === 'general') {
          setChatRooms(sampleGroupChats);
          if (!selectedRoom) setSelectedRoom(sampleGroupChats[0]);
        } else if (activeTab === 'groups') {
          setChatRooms(sampleProjectChats);
          if (!selectedRoom) setSelectedRoom(sampleProjectChats[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching group chats:', error);
      setApiError('Failed to load group chats. Please try again later.');
      
      // Use sample data as fallback
      if (activeTab === 'general') {
        setChatRooms(sampleGroupChats);
        if (!selectedRoom) setSelectedRoom(sampleGroupChats[0]);
      } else if (activeTab === 'groups') {
        setChatRooms(sampleProjectChats);
        if (!selectedRoom) setSelectedRoom(sampleProjectChats[0]);
      }
    }
  };
  
  // Function to fetch messages for a selected group
  const fetchGroupMessages = async (groupId: string) => {
    if (!token || !groupId) {
      return;
    }
    
    setMessageLoading(true);
    
    try {
      const response = await axios.get(`/api/messages/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const formattedMessages = response.data.map((msg: any) => ({
          id: msg.id,
          groupId: msg.groupId,
          senderId: msg.senderId,
          userName: msg.userName || 'Unknown User',
          content: msg.content,
          createdAt: msg.createdAt,
          userImage: msg.userImage,
          isRead: !!msg.isRead
        }));
        
        setMessages(formattedMessages);
        setApiError(null);
        
        // Update the unread count in the selected room
        setChatRooms(rooms => 
          rooms.map(room => 
            room.id === groupId ? { ...room, unreadCount: 0 } : room
          )
        );
        
        // Scroll to bottom of messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        // Use sample messages as fallback
        setMessages(sampleMessages);
        console.error('Unexpected response format for messages:', response.data);
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      setApiError('Failed to load messages');
      // Use sample messages as fallback
      setMessages(sampleMessages);
    } finally {
      setMessageLoading(false);
    }
  };
  
  // Load data when tab changes or component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    
    const loadData = async () => {
      try {
        switch (activeTab) {
          case 'general':
          case 'groups':
            await fetchGroupChats();
            break;
          case 'inbox':
            // Implement private conversations
            break;
          case 'friends':
            // Implement friends list
            break;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setApiError('Failed to load data. Please try again later.');
        
        // Use fallback data
        if (activeTab === 'general') {
          setChatRooms(sampleGroupChats);
          setSelectedRoom(sampleGroupChats[0]);
        } else if (activeTab === 'groups') {
          setChatRooms(sampleProjectChats);
          setSelectedRoom(sampleProjectChats[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isAuthenticated, navigate, activeTab]);
  
  // Load messages when selected room changes
  useEffect(() => {
    if (selectedRoom) {
      if (activeTab === 'inbox') {
        // Fetch private messages
      } else {
        fetchGroupMessages(selectedRoom.id);
      }
    } else {
      setMessages([]);
    }
  }, [selectedRoom]);
  
  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedRoom || !token) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    
    // Optimistically add the message to the UI
    const tempId = `temp-${Date.now()}`;
    const tempMessage: GroupChatMessage = {
      id: tempId,
      groupId: selectedRoom.id,
      senderId: user?.id || '',
      userName: user?.name || 'You',
      content,
      createdAt: new Date().toISOString(),
      userImage: user?.profileImage,
      isRead: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    
    try {
      // Send message to the appropriate endpoint based on tab
      let response;
      
      if (activeTab === 'inbox') {
        // Send private message
        response = await axios.post('/api/messages', {
          receiverId: selectedRoom.id,
          content
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Send group message
        response = await axios.post(`/api/messages/groups/${selectedRoom.id}/messages`, {
          content
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data) {
        // Replace temp message with actual message from server
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? {
              ...response.data,
              userName: user?.name || 'You',
              userImage: user?.profileImage
            } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the temp message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Show error toast
      toast.error('Failed to send message. Please try again.');
    }
  };
  
  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Function to render tab title with unread count
  const getTabTitle = (title: string, count?: number) => (
    <span>
      {title}
      {count && count > 0 && (
        <Badge bg="danger" pill className="ms-2">{count}</Badge>
      )}
    </span>
  );
  
  // Get unread counts for different tabs
  const getInboxUnreadCount = () => 
    privateConversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  
  const getGroupsUnreadCount = () => 
    chatRooms.filter(room => room.isProject).reduce((total, room) => total + (room.unreadCount || 0), 0);
  
  const getGeneralUnreadCount = () =>
    chatRooms.filter(room => !room.isProject).reduce((total, room) => total + (room.unreadCount || 0), 0);
  
  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading group chat...</span>
          </div>
          <p className="mt-3 text-muted">Loading chat system...</p>
        </div>
      </Container>
    );
  }
  
  // Handle UI for trying again
  const handleTryAgain = () => {
    setLoading(true);
    setApiError(null);
    
    // Reload the current data based on the active tab
    setTimeout(() => {
      fetchGroupChats();
      setLoading(false);
    }, 500);
  };

  return (
    <Container className="mt-4 fb-messenger">
      <h2 className="mb-4">Messaging</h2>
      
      {apiError && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {apiError}
          <button 
            type="button" 
            className="btn-close float-end" 
            aria-label="Close"
            onClick={() => setApiError(null)}
          ></button>
        </div>
      )}

      {/* Chat Navigation Tabs */}
      <Nav variant="tabs" className="mb-4">
        <Nav.Item>
          <Nav.Link 
            eventKey="inbox" 
            active={activeTab === 'inbox'}
            onClick={() => setActiveTab('inbox')}
          >
            {getTabTitle('Inbox', getInboxUnreadCount())}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            eventKey="groups" 
            active={activeTab === 'groups'}
            onClick={() => setActiveTab('groups')}
          >
            {getTabTitle('Groups', getGroupsUnreadCount())}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            eventKey="general" 
            active={activeTab === 'general'}
            onClick={() => setActiveTab('general')}
          >
            {getTabTitle('General Discussion', getGeneralUnreadCount())}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            eventKey="friends" 
            active={activeTab === 'friends'}
            onClick={() => setActiveTab('friends')}
          >
            {getTabTitle('Friends')}
          </Nav.Link>
        </Nav.Item>
      </Nav>
      
      {apiError && (
        <div className="text-center mt-3 mb-4">
          <Button variant="primary" onClick={handleTryAgain}>
            <i className="bi bi-arrow-repeat me-2"></i>
            Try Again
          </Button>
        </div>
      )}
      
      <Row>
        {/* Left Sidebar - Chat Rooms or Friends */}
        <Col md={4} lg={3} className="mb-4">
          <Card className="sidebar-card">
            <Card.Header className="fb-header">
              <h5 className="mb-0">
                {activeTab === 'friends' ? 'Contacts' : 'Chat Rooms'}
              </h5>
            </Card.Header>
            
            <ListGroup variant="flush" className="chat-list">
              {chatRooms.length === 0 ? (
                <ListGroup.Item className="text-center text-muted py-4">
                  No {activeTab === 'inbox' ? 'conversations' : activeTab === 'groups' ? 'group chats' : 'channels'} found
                </ListGroup.Item>
              ) : (
                chatRooms.map(room => (
                  <ListGroup.Item 
                    key={room.id}
                    action
                    active={selectedRoom?.id === room.id}
                    onClick={() => setSelectedRoom(room)}
                    className="chat-room-item d-flex align-items-center"
                  >
                    <div className="chat-avatar me-2">
                      {room.isProject ? (
                        <div className="project-avatar">
                          <i className="bi bi-folder-fill"></i>
                        </div>
                      ) : (
                        <div className="group-avatar">
                          <span>{room.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="chat-info flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <span className="chat-name">{room.name}</span>
                        <small className="chat-time">
                          {new Date(room.lastActivity).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </small>
                      </div>
                      <div className="d-flex justify-content-between">
                        <small className="chat-preview">{room.description}</small>
                        {room.unreadCount > 0 && (
                          <Badge bg="primary" pill>{room.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
            
            <Card.Footer className="bg-light">
              <Button 
                variant="primary" 
                size="sm" 
                className="w-100"
                onClick={() => activeTab === 'inbox' 
                  ? navigate('/messages/new') 
                  : activeTab === 'groups' 
                    ? navigate('/messages/new-group')
                    : navigate('/messages/search')}
              >
                <i className="bi bi-plus-circle me-2"></i>
                {activeTab === 'inbox' 
                  ? 'New Message' 
                  : activeTab === 'groups' 
                    ? 'Create Group' 
                    : 'Join Channel'}
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        
        {/* Right Content - Chat Window */}
        <Col md={8} lg={9}>
          <Card className="chat-window">
            <Card.Header className="fb-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="chat-avatar me-2">
                  {selectedRoom?.isProject ? (
                    <div className="project-avatar">
                      <i className="bi bi-folder-fill"></i>
                    </div>
                  ) : selectedRoom ? (
                    <div className="group-avatar">
                      <span>{selectedRoom.name.charAt(0)}</span>
                    </div>
                  ) : (
                    <div className="group-avatar">
                      <i className="bi bi-chat-dots"></i>
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="mb-0">
                    {selectedRoom?.name || 'Select a room'}
                  </h5>
                  {selectedRoom && (
                    <small className="text-muted">
                      {selectedRoom.memberCount || 1} {(selectedRoom.memberCount || 1) === 1 ? 'member' : 'members'}
                    </small>
                  )}
                </div>
              </div>
              
              {selectedRoom?.isProject && (
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={() => navigate(`/startup/${selectedRoom.projectId}`)}
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i>
                  View Project
                </Button>
              )}
            </Card.Header>
            
            <Card.Body className="chat-messages">
              {messageLoading ? (
                <div className="text-center my-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading messages...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading messages...</p>
                </div>
              ) : !selectedRoom ? (
                <div className="text-center text-muted my-5">
                  <i className="bi bi-chat-square-text fs-1"></i>
                  <p className="mt-3">Select a conversation to start chatting</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted my-5">
                  <i className="bi bi-chat-dots-fill fs-1"></i>
                  <p className="mt-3">No messages yet. Be the first to send a message!</p>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div 
                      key={message.id}
                      className={`message ${message.senderId === user?.id ? 'message-outgoing' : 'message-incoming'}`}
                    >
                      <div className={`d-flex ${message.senderId === user?.id ? 'justify-content-end' : 'justify-content-start'}`}>
                        {message.senderId !== user?.id && (
                          <div className="message-avatar me-2">
                            {message.userImage ? (
                              <img 
                                src={`/uploads/profiles/${message.userImage}`} 
                                alt={message.userName} 
                                className="rounded-circle"
                                width="32"
                                height="32"
                              />
                            ) : (
                              <div className="user-initial">
                                {message.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="message-content">
                          {message.senderId !== user?.id && (
                            <div className="message-sender">{message.userName}</div>
                          )}
                          <div className="message-bubble">
                            {message.content}
                            <div className="message-time">
                              {formatTimestamp(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Card.Body>
            
            <Card.Footer className="message-input-area">
              <Form onSubmit={handleSendMessage}>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!selectedRoom}
                    className="message-input"
                  />
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={!newMessage.trim() || !selectedRoom}
                    className="send-button"
                  >
                    <i className="bi bi-send-fill"></i>
                  </Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <style>{`
        .fb-messenger {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        
        .fb-header {
          background-color: #0084ff; 
          color: white;
          border-bottom: none;
        }
        
        .sidebar-card, .chat-window {
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          border: none;
          overflow: hidden;
        }
        
        .chat-list .list-group-item {
          border-left: none;
          border-right: none;
          padding: 12px 15px;
        }
        
        .chat-list .list-group-item.active {
          background-color: #f0f2f5;
          color: #050505;
          border-color: #ddd;
        }
        
        .chat-room-item {
          transition: background-color 0.2s;
        }
        
        .chat-room-item:hover {
          background-color: #f5f6f7;
        }
        
        .chat-avatar {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
        }
        
        .project-avatar, .group-avatar, .user-initial {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          font-weight: bold;
        }
        
        .project-avatar {
          background-color: #F7B928;
        }
        
        .group-avatar {
          background-color: #0084ff;
        }
        
        .chat-name {
          font-weight: 500;
          color: #050505;
        }
        
        .chat-preview {
          color: #65676B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        
        .chat-time {
          color: #65676B;
          font-size: 0.7rem;
        }
        
        .chat-messages {
          height: 400px;
          overflow-y: auto;
          background-color: #f0f2f5;
          padding: 16px;
        }
        
        .message {
          margin-bottom: 16px;
        }
        
        .message-avatar {
          width: 32px;
          height: 32px;
        }
        
        .user-initial {
          width: 100%;
          height: 100%;
          background-color: #ccc;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 14px;
          font-weight: bold;
        }
        
        .message-sender {
          font-size: 12px;
          margin-bottom: 2px;
          color: #65676B;
        }
        
        .message-bubble {
          padding: 8px 12px;
          border-radius: 18px;
          max-width: 75%;
          word-wrap: break-word;
          position: relative;
        }
        
        .message-incoming .message-bubble {
          background-color: #f0f0f0;
          color: #050505;
          border-top-left-radius: 4px;
        }
        
        .message-outgoing .message-bubble {
          background-color: #0084ff;
          color: white;
          border-top-right-radius: 4px;
          margin-left: auto;
        }
        
        .message-time {
          font-size: 11px;
          margin-top: 2px;
          text-align: right;
          opacity: 0.7;
        }
        
        .message-input-area {
          background-color: white;
          border-top: 1px solid #e4e6eb;
          padding: 12px;
        }
        
        .message-input {
          border-radius: 20px;
          padding: 8px 16px;
          border: 1px solid #ddd;
        }
        
        .message-input:focus {
          box-shadow: none;
          border-color: #0084ff;
        }
        
        .send-button {
          border-radius: 50%;
          width: 40px;
          height: 40px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
        }
        
        .nav-tabs .nav-link.active {
          font-weight: 500;
          color: #0084ff;
          border-color: #dee2e6 #dee2e6 #fff;
        }
      `}</style>
    </Container>
  );
};

export default GroupChat; 