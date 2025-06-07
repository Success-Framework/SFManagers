import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Search, Users, Phone, Video, MoreVertical, Paperclip, Smile, X } from 'lucide-react';
import ChatSidebar from './components/ChatSideBar';
import { getConversation, initializeSocketConnection, disconnectSocket } from '../../api/message';

import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import GroupModal from './components/GroupModal';
import UserProfile from './components/UserProfile';
import './styles/ChatBox.css';

const ChatBox = ({ currentUser, startupId }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [chatType, setChatType] = useState('direct'); // 'direct' or 'group'
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);

  // Fetch groups on component mount
  useEffect(() => {
    if (startupId) {
      fetchGroups();
      fetchUsers();
    }
  }, [startupId]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat, chatType]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/chat/groups/${startupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users/startup/${startupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter(user => user.id !== currentUser.id));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const queryParams = chatType === 'direct' 
        ? `userId=${activeChat.id}` 
        : `groupId=${activeChat.id}`;
      
      const response = await fetch(`/api/chat/messages?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return;

    try {
      const messageData = {
        content,
        ...(chatType === 'direct' 
          ? { receiverId: activeChat.id, type: 'direct' }
          : { groupId: activeChat.id, type: 'group' }
        ),
        startupId
      };

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createGroup = async (groupData) => {
    try {
      const response = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...groupData,
          startupId
        })
      });

      if (response.ok) {
        fetchGroups();
        setIsGroupModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleChatSelect = async (chat, type) => {
    setActiveChat(chat);
    setChatType(type);
    setMessages([]);
    const token = localStorage.getItem('token');
    if (token) {
      initializeSocketConnection(token);
    }
    if (type === 'direct') {
      try {
        setLoading(true);
        const data = await getConversation(chat.id);
        setMessages(data);
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // handle group chat fetch if needed
    }
  };

  const handleUserProfileOpen = (user) => {
    setSelectedUser(user);
    setIsUserProfileOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chatbox-container">
      <div className="chatbox-layout">
        {/* Sidebar */}
        <ChatSidebar
          users={filteredUsers}
          groups={filteredGroups}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeChat={activeChat}
          chatType={chatType}
          onChatSelect={handleChatSelect}
          onCreateGroup={() => setIsGroupModalOpen(true)}
          onUserProfileOpen={handleUserProfileOpen}
          onlineUsers={onlineUsers}
          currentUser={currentUser}
        />

        {/* Main Chat Area */}
        <div className="chatbox-main">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar">
                    {chatType === 'group' ? (
                      <div className="group-avatar">
                        <Users size={20} />
                      </div>
                    ) : (
                      <div className="user-avatar">
                        {activeChat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="chat-details">
                    <h3>{activeChat.name}</h3>
                    <span className="chat-status">
                      {chatType === 'group' 
                        ? `${activeChat.members?.length || 0} members`
                        : onlineUsers.has(activeChat.id) ? 'Online' : 'Offline'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="chat-actions">
                  <button className="chat-action-btn">
                    <Phone size={18} />
                  </button>
                  <button className="chat-action-btn">
                    <Video size={18} />
                  </button>
                  <button 
                    className="chat-action-btn"
                    onClick={() => handleUserProfileOpen(activeChat)}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <MessageList
                messages={messages}
                currentUser={currentUser}
                loading={loading}
                typingUsers={typingUsers}
                chatType={chatType}
                messagesEndRef={messagesEndRef}
              />

              {/* Message Input */}
              <MessageInput
                onSendMessage={sendMessage}
                disabled={loading}
              />
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <Users size={64} className="no-chat-icon" />
                <h3>Select a conversation</h3>
                <p>Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isGroupModalOpen && (
        <GroupModal
          users={users}
          onCreateGroup={createGroup}
          onClose={() => setIsGroupModalOpen(false)}
        />
      )}

      {isUserProfileOpen && selectedUser && (
        <UserProfile
          user={selectedUser}
          currentUser={currentUser}
          onClose={() => setIsUserProfileOpen(false)}
          onStartChat={() => {
            handleChatSelect(selectedUser, 'direct');
            setIsUserProfileOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatBox;
