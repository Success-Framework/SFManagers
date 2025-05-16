import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Tabs, Tab, Form, Badge, Spinner, Nav, InputGroup } from 'react-bootstrap';
import { Resizable } from 're-resizable';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import io, { Socket } from 'socket.io-client';
import jwt_decode from 'jwt-decode';
import { FaSearch, FaPaperPlane } from 'react-icons/fa';
import './GlobalChatModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSmile, faPaperclip, faCircle } from '@fortawesome/free-solid-svg-icons';
import { IoMdSend } from 'react-icons/io';
import { debounce } from 'lodash';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  isOnline?: boolean;
}

interface Startup {
  id: string;
  name: string;
  logo?: string;
}

interface Message {
  id: string;
  content: string;
  sender: User | string;
  receiver?: string;
  groupId?: string;
  createdAt: string;
  read?: boolean;
}

interface UserWithUnread extends User {
  unreadCount: number;
  lastMessage?: Message;
}

interface StartupWithUnread extends Startup {
  unreadCount: number;
  lastMessage?: Message;
}

interface DecodedToken {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface GlobalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  initialGroup?: string; // Initial group/startup ID to open
  initialUserId?: string; // Initial user ID to open
}

declare global {
  interface Window {
    addChatNotification: (sender: string, message: string, avatar?: string, groupId?: string) => void;
    openGlobalChat: (userId?: string, groupId?: string) => void;
  }
}

const GlobalChatModal: React.FC<GlobalChatModalProps> = ({ isOpen, onClose, onUnreadCountChange, initialGroup, initialUserId }) => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialGroup ? 'groups' : 'private');
  const [users, setUsers] = useState<UserWithUnread[]>([]);
  const [groups, setGroups] = useState<StartupWithUnread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserWithUnread | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<StartupWithUnread | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const wsConnected = useRef<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentUser = useRef<DecodedToken | null>(null);
  
  // Set initial size
  const [size, setSize] = useState({
    width: 600,
    height: 500,
  });
  
  const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
  
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!authState.token || wsConnected.current) return;
    
    try {
      const decoded: DecodedToken = jwt_decode(authState.token);
      currentUser.current = decoded;
      
      socketRef.current = io(API_BASE_URL, {
        query: { token: authState.token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      socketRef.current.on('connect', () => {
        console.log('Connected to chat socket');
        wsConnected.current = true;
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log('Disconnected from chat socket:', reason);
      });
      
      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      socketRef.current.on('new_message', (message: Message) => {
        handleNewMessage(message);
      });
      
      socketRef.current.on('typing', (data: { userId: string; typing: boolean }) => {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: data.typing
        }));
      });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        wsConnected.current = false;
      };
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, [authState.token]);
  
  // Handle new message from WebSocket
  const handleNewMessage = useCallback((newMsg: Message) => {
    setMessages(prev => [...prev, newMsg]);
    
    // If the message is from the selected user or group
    const isRelevantMessage = 
      (selectedUser && newMsg.sender.id === selectedUser.id) ||
      (selectedGroup && newMsg.sender.id === selectedGroup.id);
    
    if (!isRelevantMessage) {
      // Update unread count for sender
      setUnreadCounts(prev => ({
        ...prev,
        [newMsg.sender.id]: (prev[newMsg.sender.id] || 0) + 1
      }));
      
      // Trigger notification
      showChatNotification(newMsg);
    }
    
    // Auto-scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [selectedUser, selectedGroup]);
  
  // Show chat notification
  const showChatNotification = (msg: Message) => {
    if (window.addChatNotification) {
      window.addChatNotification({
        sender: msg.sender.firstName,
        message: msg.content,
        timestamp: new Date(msg.createdAt),
        avatar: msg.sender.avatarUrl,
        onClick: () => {
          // If it's a direct message
          const userMatch = users.find(u => u.id === msg.sender.id);
          if (userMatch) {
            setActiveTab('users');
            setSelectedUser(userMatch);
            setSelectedGroup(null);
          } else {
            // Try to find if it's a group message
            const groupMatch = groups.find(g => g.id === msg.groupId);
            if (groupMatch) {
              setActiveTab('groups');
              setSelectedGroup(groupMatch);
              setSelectedUser(null);
            }
          }
        }
      });
    }
    
    // Play notification sound
    playNotificationSound();
  };
  
  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/audio/message-notification.mp3');
    audio.play().catch(err => console.log('Error playing notification sound', err));
  };
  
  // Setup WebSocket connection when modal is shown
  useEffect(() => {
    if (isOpen && authState.token) {
      connectWebSocket();
    }
  }, [isOpen, authState.token, connectWebSocket]);
  
  // Fetch users and groups when modal is shown
  useEffect(() => {
    if (isOpen && authState.token) {
      fetchUsers();
      fetchGroups();
      
      // Handle initialGroup if provided
      if (initialGroup && activeTab === 'groups') {
        fetchGroupById(initialGroup);
      }
      
      // Handle initialUserId if provided
      if (initialUserId && activeTab === 'private') {
        fetchUserById(initialUserId);
      }
    }
  }, [isOpen, authState.token, initialGroup, initialUserId, activeTab]);
  
  // Fetch group by ID
  const fetchGroupById = async (groupId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/startups/${groupId}`, {
        headers: {
          'x-auth-token': authState.token
        }
      });
      
      const group = {
        id: response.data._id,
        name: response.data.name,
        logo: response.data.logo
      };
      
      setSelectedGroup(group);
      fetchGroupMessages(groupId);
      
      // Subscribe to group channel
      if (socketRef.current) {
        socketRef.current.emit('subscribe', {
          type: 'startup',
          startupId: groupId
        });
      }
    } catch (error) {
      console.error('Error fetching group by ID:', error);
      toast.error('Failed to load group chat');
    }
  };
  
  // Fetch user by ID
  const fetchUserById = async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          'x-auth-token': authState.token
        }
      });
      
      const user = {
        id: response.data._id || response.data.id,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        avatarUrl: response.data.avatarUrl,
        unreadCount: 0
      };
      
      setSelectedUser(user);
      fetchDirectMessages(userId);
      
      // Subscribe to user channel
      if (socketRef.current) {
        socketRef.current.emit('subscribe', {
          type: 'user',
          userId
        });
      }
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      toast.error('Failed to load user chat');
    }
  };
  
  // Fetch users for direct messaging
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      // Get unread counts
      const unreadResponse = await axios.get(`${API_BASE_URL}/api/messages/unread`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      const unreadCounts = unreadResponse.data.reduce((acc: any, item: any) => {
        acc[item.senderId] = item.count;
        return acc;
      }, {});
      
      // Get last messages
      const lastMessagesResponse = await axios.get(`${API_BASE_URL}/api/messages/last`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      const lastMessages = lastMessagesResponse.data.reduce((acc: any, item: any) => {
        acc[item.senderId] = item;
        return acc;
      }, {});
      
      const usersWithUnread = response.data
        .filter((user: User) => user.id !== currentUser.current?.id)
        .map((user: User) => ({
          ...user,
          unreadCount: unreadCounts[user.id] || 0,
          lastMessage: lastMessages[user.id]
        }))
        .sort((a: UserWithUnread, b: UserWithUnread) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      
      setUsers(usersWithUnread);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setIsLoading(false);
    }
  };
  
  // Fetch user's groups/startups
  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/startups/member`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      // Get unread counts for groups
      const unreadResponse = await axios.get(`${API_BASE_URL}/api/messages/groups/unread`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      const unreadCounts = unreadResponse.data.reduce((acc: any, item: any) => {
        acc[item.groupId] = item.count;
        return acc;
      }, {});
      
      // Get last messages for groups
      const lastMessagesResponse = await axios.get(`${API_BASE_URL}/api/messages/groups/last`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      const lastMessages = lastMessagesResponse.data.reduce((acc: any, item: any) => {
        acc[item.groupId] = item;
        return acc;
      }, {});
      
      const groupsWithUnread = response.data.map((group: Startup) => ({
        ...group,
        unreadCount: unreadCounts[group.id] || 0,
        lastMessage: lastMessages[group.id]
      }))
      .sort((a: StartupWithUnread, b: StartupWithUnread) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      
      setGroups(groupsWithUnread);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
      setIsLoading(false);
    }
  };
  
  // Fetch direct messages between current user and selected user
  const fetchDirectMessages = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/messages/user/${userId}`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      setMessages(response.data);
      setIsLoading(false);
      
      // Reset unread count
      setUnreadCounts(prev => ({
        ...prev,
        [userId]: 0
      }));
      
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      toast.error('Failed to load messages');
      setIsLoading(false);
    }
  };
  
  // Fetch messages for a group/startup
  const fetchGroupMessages = async (groupId: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/startups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      setMessages(response.data);
      setIsLoading(false);
      
      // Reset unread count
      setUnreadCounts(prev => ({
        ...prev,
        [groupId]: 0
      }));
      
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching group messages:', error);
      toast.error('Failed to load messages');
      setIsLoading(false);
    }
  };
  
  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      let response;
      const messageData = {
        content: newMessage,
        sender: currentUser.current?.id,
      };
      
      // Add the message optimistically to the UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender: currentUser.current as User,
        createdAt: new Date().toISOString(),
        read: true
      };
      
      if (selectedUser) {
        // Direct message
        setMessages(prev => [...prev, optimisticMessage]);
        
        response = await axios.post(`${API_BASE_URL}/api/messages/user/${selectedUser.id}`, messageData, {
          headers: { Authorization: `Bearer ${authState.token}` }
        });
      } else if (selectedGroup) {
        // Group message
        optimisticMessage.groupId = selectedGroup.id;
        setMessages(prev => [...prev, optimisticMessage]);
        
        response = await axios.post(`${API_BASE_URL}/api/startups/${selectedGroup.id}/messages`, messageData, {
          headers: { Authorization: `Bearer ${authState.token}` }
        });
      }
      
      // Replace optimistic message with actual message
      if (response) {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? response.data : msg
        ));
      }
      
      // Update the latest message in the sidebar list
      if (selectedUser) {
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? { 
            ...user, 
            lastMessage: response?.data 
          } : user
        ));
      } else if (selectedGroup) {
        setGroups(prev => prev.map(group => 
          group.id === selectedGroup.id ? { 
            ...group, 
            lastMessage: response?.data 
          } : group
        ));
      }
      
      // Clear the message input
      setNewMessage('');
      setIsTyping(false);
      emitTypingStatus(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = (): GroupedMessages => {
    const grouped: GroupedMessages = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });
    
    return grouped;
  };
  
  // Handle user selection
  const handleUserSelect = (user: UserWithUnread) => {
    if (selectedUser?.id === user.id) return;
    
    setSelectedUser(user);
    setSelectedGroup(null);
    fetchDirectMessages(user.id);
    setNewMessage('');
  };
  
  // Handle group selection
  const handleGroupSelect = (group: StartupWithUnread) => {
    if (selectedGroup?.id === group.id) return;
    
    setSelectedGroup(group);
    setSelectedUser(null);
    fetchGroupMessages(group.id);
    setNewMessage('');
    
    // Subscribe to group channel
    if (socketRef.current) {
      socketRef.current.emit('subscribe', {
        type: 'startup',
        startupId: group.id
      });
    }
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (socketRef.current) {
      if (!isTyping) {
        setIsTyping(true);
        emitTypingStatus(true);
      }
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        setIsTyping(false);
        emitTypingStatus(false);
      }, 3000);
      
      typingTimeoutRef.current = timeout as unknown as NodeJS.Timeout;
    }
  };
  
  // Send typing indicator
  const emitTypingStatus = (typing: boolean) => {
    if (!socketRef.current || !currentUser.current) return;
    
    const recipient = selectedUser ? selectedUser.id : (selectedGroup ? selectedGroup.id : null);
    if (!recipient) return;
    
    socketRef.current.emit('typing', {
      userId: currentUser.current.id,
      recipientId: recipient,
      isGroup: !!selectedGroup,
      typing
    });
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  // Filter users/groups by search term
  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get typing indicator text
  const getTypingIndicatorText = () => {
    const typingUserIds = Object.keys(typingUsers).filter(id => typingUsers[id]);
    
    if (typingUserIds.length === 0) return null;
    
    if (selectedUser && typingUsers[selectedUser.id]) {
      return `${selectedUser.firstName} ${selectedUser.lastName} is typing...`;
    }
    
    if (selectedGroup) {
      const typingUserNames = typingUserIds.map(id => {
        const user = users.find(u => u.id === id);
        return user ? `${user.firstName} ${user.lastName}` : 'Someone';
      });
      
      if (typingUserNames.length === 1) {
        return `${typingUserNames[0]} is typing...`;
      } else if (typingUserNames.length === 2) {
        return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
      } else if (typingUserNames.length > 2) {
        return 'Several people are typing...';
      }
    }
    
    return null;
  };
  
  // Render avatar
  const renderAvatar = (user: User) => {
    if (user.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          alt={`${user.firstName} ${user.lastName}`}
          className="chat-avatar"
        />
      );
    }
    
    return (
      <div className="chat-avatar-placeholder">
        {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
      </div>
    );
  };
  
  // Render group logo
  const renderGroupLogo = (group: Startup) => {
    if (group.logo) {
      return (
        <img
          src={group.logo}
          alt={group.name}
          className="chat-group-logo"
        />
      );
    }
    
    return (
      <div className="chat-group-logo-placeholder">
        {group.name.charAt(0).toUpperCase()}
      </div>
    );
  };
  
  // Handle resize
  const handleResize = (_: any, direction: any, ref: HTMLElement) => {
    setSize({
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
  };
  
  const messageGroups = groupMessagesByDate();
  
  // Fetch unread count periodically
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUnreadMessages = async () => {
      try {
        const count = await GlobalChatModal.getUnreadCount();
        if (onUnreadCountChange) {
          onUnreadCountChange(count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadMessages();
    const intervalId = setInterval(fetchUnreadMessages, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, onUnreadCountChange]);

  // Local fetch unread count method
  const fetchUnreadCount = async () => {
    try {
      const count = await GlobalChatModal.getUnreadCount();
      if (onUnreadCountChange) {
        onUnreadCountChange(count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      size="lg"
      dialogClassName="global-chat-modal"
      aria-labelledby="global-chat-modal"
      backdrop={true}
      enforceFocus={false}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="global-chat-modal">
          {selectedUser ? (
            <div className="d-flex align-items-center">
              {renderAvatar(selectedUser)}
              <span className="ml-2">{selectedUser.firstName} {selectedUser.lastName}</span>
            </div>
          ) : selectedGroup ? (
            <div className="d-flex align-items-center">
              {renderGroupLogo(selectedGroup)}
              <span className="ml-2">{selectedGroup.name}</span>
            </div>
          ) : (
            'Messages'
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <Resizable
          size={size}
          onResizeStop={handleResize}
          minHeight={300}
          minWidth={400}
          maxWidth="90vw"
          maxHeight="80vh"
          enable={{
            top: false,
            right: true,
            bottom: true,
            left: true,
            topRight: false,
            bottomRight: true,
            bottomLeft: true,
            topLeft: false,
          }}
          className="chat-resizable-container"
        >
          <div className="chat-container">
            <div className="chat-sidebar">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'private')}
                className="chat-tabs"
              >
                <Tab eventKey="private" title="Private">
                  <div className="chat-search">
                    <Form.Control
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="chat-users-list">
                    {isLoading ? (
                      <div className="text-center mt-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center mt-3">
                        <p className="text-muted">No users found</p>
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`chat-user-item ${
                            selectedUser?.id === user.id ? 'active' : ''
                          }`}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="d-flex align-items-center">
                            {renderAvatar(user)}
                            <div className="ml-2">
                              <div className="chat-user-name">{user.firstName} {user.lastName}</div>
                              <div className="chat-user-email">{user.email}</div>
                            </div>
                          </div>
                          {unreadCounts[user.id] ? (
                            <Badge variant="danger" pill>
                              {unreadCounts[user.id]}
                            </Badge>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </Tab>
                <Tab eventKey="groups" title="Groups">
                  <div className="chat-search">
                    <Form.Control
                      type="text"
                      placeholder="Search groups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="chat-groups-list">
                    {isLoading ? (
                      <div className="text-center mt-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : filteredGroups.length === 0 ? (
                      <div className="text-center mt-3">
                        <p className="text-muted">No groups found</p>
                      </div>
                    ) : (
                      filteredGroups.map((group) => (
                        <div
                          key={group.id}
                          className={`chat-group-item ${
                            selectedGroup?.id === group.id ? 'active' : ''
                          }`}
                          onClick={() => handleGroupSelect(group)}
                        >
                          <div className="d-flex align-items-center">
                            {renderGroupLogo(group)}
                            <div className="ml-2">
                              <div className="chat-group-name">{group.name}</div>
                            </div>
                          </div>
                          {unreadCounts[group.id] ? (
                            <Badge variant="danger" pill>
                              {unreadCounts[group.id]}
                            </Badge>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </Tab>
              </Tabs>
            </div>
            <div className="chat-main">
              {selectedUser || selectedGroup ? (
                <>
                  <div className="chat-messages" ref={messagesContainerRef}>
                    {isLoading ? (
                      <div className="text-center mt-3">
                        <Spinner animation="border" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center mt-3">
                        <p className="text-muted">No messages yet</p>
                      </div>
                    ) : (
                      Object.entries(messageGroups).map(([date, msgs]) => (
                        <div key={date} className="message-date-group">
                          <div className="message-date-divider">
                            <span>{date}</span>
                          </div>
                          {msgs.map((message, index) => {
                            const isCurrentUser = 
                              message.sender.id === currentUser.current?.id;
                            
                            const prevMessage = index > 0 ? msgs[index - 1] : null;
                            const prevSenderId = prevMessage ? prevMessage.sender.id : null;
                            
                            // Show sender info if first message or different sender from previous
                            const showSenderInfo = 
                              !prevMessage || prevSenderId !== message.sender.id;
                            
                            return (
                              <div
                                key={message.id}
                                className={`chat-message ${
                                  isCurrentUser ? 'own-message' : 'other-message'
                                } ${showSenderInfo ? '' : 'consecutive-message'}`}
                              >
                                {!isCurrentUser && showSenderInfo && (
                                  <div className="message-sender-info">
                                    {renderAvatar(message.sender)}
                                    <span className="message-sender-name">
                                      {message.sender.firstName} {message.sender.lastName}
                                    </span>
                                  </div>
                                )}
                                <div className="message-content">
                                  <div className="message-bubble">
                                    {message.content}
                                  </div>
                                  <div className="message-time">
                                    {formatDistanceToNow(new Date(message.createdAt), {
                                      addSuffix: true
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="chat-typing-indicator">
                    {getTypingIndicatorText()}
                  </div>
                  <div className="chat-input">
                    <Form onSubmit={handleSendMessage}>
                      <div className="input-group">
                        <Form.Control
                          as="textarea"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={handleInputChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                          ref={messageInputRef}
                          rows={1}
                          className="chat-textarea"
                          maxLength={1000}
                        />
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={!newMessage.trim()}
                        >
                          Send
                        </Button>
                      </div>
                    </Form>
                  </div>
                </>
              ) : (
                <div className="chat-placeholder">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </Resizable>
      </Modal.Body>
    </Modal>
  );
};

// Static method to get unread count
GlobalChatModal.getUnreadCount = async (): Promise<number> => {
  const token = localStorage.getItem('token');
  if (!token) return 0;
  
  // First try the chat API
  try {
    const API_BASE_URL = process.env.REACT_APP_API_URL || '';
    const CHAT_API_URL = `${API_BASE_URL}/api/chat/unread`;
    
    const response = await axios.get(CHAT_API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && typeof response.data.count === 'number') {
      return response.data.count;
    }
    
    // If count is not directly in the response, try to get it from unreadCounts field
    if (response.data && response.data.unreadCounts) {
      let totalCount = 0;
      for (const [key, value] of Object.entries(response.data.unreadCounts)) {
        totalCount += Number(value);
      }
      return totalCount;
    }
    
    return 0;
  } catch (error) {
    // If chat API fails, try the messages API
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || '';
      const MESSAGE_API_URL = `${API_BASE_URL}/api/messages/unread`;
      
      const response = await axios.get(MESSAGE_API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && typeof response.data.count === 'number') {
        return response.data.count;
      }
      
      return 0;
    } catch (secondError) {
      console.error('Error fetching unread count from both APIs:', secondError);
      return 0;
    }
  }
};

// Make GlobalChat accessible from anywhere in the app
if (typeof window !== 'undefined') {
  window.openGlobalChat = (userId?: string, groupId?: string) => {
    // Find the DOM element that includes the GlobalChatModal
    const chatContainer = document.getElementById('global-chat-container');
    
    if (chatContainer) {
      // Trigger the show method on the component
      const event = new CustomEvent('openGlobalChat', { 
        detail: { userId, groupId } 
      });
      chatContainer.dispatchEvent(event);
    } else {
      console.error('Global chat container not found');
    }
  };
}

export default GlobalChatModal; 