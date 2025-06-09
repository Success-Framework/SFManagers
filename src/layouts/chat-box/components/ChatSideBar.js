import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, MessageCircle, Hash } from 'lucide-react';
import {getProfiles} from "../../../api/profile"; // Adjust the import path as necessary
import { getInboxMessages, getSentMessages } from "../../../api/message";
import { getProfileById } from "../../../api/profile"; // <-- Import this


const ChatSidebar = ({
  users,
  groups,
  searchQuery,
  setSearchQuery,
  activeChat,
  chatType,
  onChatSelect,
  onCreateGroup,
  onUserProfileOpen,
  onlineUsers,
  currentUser,
  setMessages, // <-- Add this prop to update messages in parent
  setLoading,  // <-- Optional: to show loading state
}) => {
  const [activeTab, setActiveTab] = useState('recent');
  const [profiles, setProfiles] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]); // [{ user, messages: [] }]

  // Fetch profiles when "People" tab is clicked
  useEffect(() => {
    if (activeTab === 'direct') {
      const fetchProfiles = async () => {
        try {
          const data = await getProfiles();
          setProfiles(data?.profiles || []);
        } catch (error) {
          console.error("Error fetching profiles:", error);
        }
      };
      fetchProfiles();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'recent') {
      const fetchRecentConversations = async () => {
        try {
          setLoading?.(true);
          const inbox = await getInboxMessages();
          const sent = await getSentMessages();
          const allMessages = [...inbox, ...sent];

          // Group messages by the other user's id
          const conversations = {};
          for (const msg of allMessages) {
            // Determine the other user's id (not the current user)
            const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            if (!conversations[otherUserId]) conversations[otherUserId] = [];
            conversations[otherUserId].push(msg);
          }

          // Fetch profile for each user and build conversation list
          const userConvoList = await Promise.all(
            Object.entries(conversations).map(async ([userId, messages]) => {
              try {
                const userProfile = await getProfileById(userId);
                return { user: userProfile, messages };
              } catch (e) {
                return null; // skip if profile fetch fails
              }
            })
          );

          setRecentConversations(userConvoList.filter(Boolean));
        } catch (error) {
          // Optionally handle error
        } finally {
          setLoading?.(false);
        }
      };
      fetchRecentConversations();
    }
  }, [activeTab, currentUser, setLoading]);

  // !=====================================================================================================
//   useEffect(() => {
//   let intervalId;

//   const fetchRecentConversations = async () => {
//     try {
//       setLoading?.(true);
//       const inbox = await getInboxMessages();
//       const sent = await getSentMessages();
//       const allMessages = [...inbox, ...sent];

//       const conversations = {};
//       for (const msg of allMessages) {
//         const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
//         if (!conversations[otherUserId]) conversations[otherUserId] = [];
//         conversations[otherUserId].push(msg);
//       }

//       const userConvoList = await Promise.all(
//         Object.entries(conversations).map(async ([userId, messages]) => {
//           try {
//             const userProfile = await getProfileById(userId);
//             return { user: userProfile, messages };
//           } catch (e) {
//             return null;
//           }
//         })
//       );

//       setRecentConversations(userConvoList.filter(Boolean));
//     } catch (error) {
//       console.error("Error fetching recent conversations:", error);
//     } finally {
//       setLoading?.(false);
//     }
//   };

//   if (activeTab === 'recent') {
//     fetchRecentConversations(); // Initial fetch
//     intervalId = setInterval(fetchRecentConversations, 5000); // Poll every 5 seconds
//   }

//   return () => {
//     clearInterval(intervalId); // Clean up on tab switch or unmount
//   };
// }, [activeTab, currentUser, setLoading]);

  const getLastMessage = (chat, type) => {
    // This would typically come from your message data
    return 'Last message preview...';
  };

  const getUnreadCount = (chat, type) => {
    // This would typically come from your message data
    return Math.floor(Math.random() * 5); // Placeholder
  };

  const isActive = (chat, type) => {
    return activeChat?.id === chat.id && chatType === type;
  };

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h2>Chat</h2>
        <button 
          className="new-chat-btn"
          onClick={onCreateGroup}
          title="Create new group"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <MessageCircle size={16} />
          Recent
        </button>
        <button
          className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
          onClick={() => setActiveTab('direct')}
        >
          <Users size={16} />
          People
        </button>
        <button
          className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <Hash size={16} />
          Groups
        </button>
      </div>

      {/* Chat List */}
      <div className="chat-list">
        {activeTab === 'recent' && (
          <div className="recent-chats">
            {recentConversations.map(({ user, messages }) => (
              <div
                key={user.id}
                className={`chat-item`}
                onClick={() => onChatSelect(user, 'direct')}
              >
                <div className="chat-item-avatar">
                  <div className="user-avatar">
                    {user.fullName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <span className="chat-item-name">{user.fullName || user.name}</span>
                    <span className="chat-item-time">
                      {messages[messages.length - 1]?.createdAt
                        ? new Date(messages[messages.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <div className="chat-item-preview">
                    <span className="last-message">
                      {messages[messages.length - 1]?.content}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'direct' && (
          <div className="direct-chats">
            <div className="section-header">
              <span>People ({profiles.length})</span>
            </div>
            {profiles.map(user => (
              <div
                key={`profile-${user.id}`}
                className="chat-item"
              >
                <div className="chat-item-avatar">
                  <div className="user-avatar">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <span className="chat-item-name">{user.fullName}</span>
                  </div>
                  <div className="chat-item-preview">
                    <span className="user-email">{user.email}</span>
                  </div>
                  <button
                    className="chat-btn"
                    onClick={() => onChatSelect(
                      { ...user, name: user.fullName || user.name }, // Ensure 'name' exists
                      'direct'
                    )}
                  >
                    Chat
                  </button>
                  
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="group-chats">
            <div className="section-header">
              <span>Groups ({groups.length})</span>
              <button 
                className="add-group-btn"
                onClick={onCreateGroup}
                title="Create group"
              >
                <Plus size={14} />
              </button>
            </div>
            {groups.map(group => (
              <div
                key={`group-${group.id}`}
                className={`chat-item ${isActive(group, 'group') ? 'active' : ''}`}
                onClick={() => onChatSelect(group, 'group')}
              >
                <div className="chat-item-avatar">
                  <div className="group-avatar">
                    <Hash size={16} />
                  </div>
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <span className="chat-item-name">{group.name}</span>
                  </div>
                  <div className="chat-item-preview">
                    <span className="group-members">
                      {group.members?.length || 0} members
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {(
          (activeTab === 'direct' && profiles.length === 0) ||
          (activeTab === 'groups' && groups.length === 0) ||
          (activeTab === 'recent' && recentConversations.length === 0 && groups.length === 0)
        ) && (
          <div className="empty-state">
            <div className="empty-state-content">
              {activeTab === 'groups' ? (
                <>
                  <Hash size={32} className="empty-icon" />
                  <p>No groups yet</p>
                  <button className="create-first-group" onClick={onCreateGroup}>
                    Create your first group
                  </button>
                </>
              ) : (
                <>
                  <Users size={32} className="empty-icon" />
                  <p>No conversations yet</p>
                  <span>Start chatting with your team members</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
