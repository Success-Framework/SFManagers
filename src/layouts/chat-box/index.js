import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Plus,
  Search,
  Users,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  X,
} from "lucide-react";
import ChatSidebar from "./components/ChatSideBar";
import {
  getConversation,
  initializeSocketConnection,
  disconnectSocket,
  getInboxMessages,
  sendMessage,
} from "../../api/message";
import { getCurrentUser } from "../../api/auth"; // <-- Import this
import { getMyStartups } from "../../api/startup";
import SocketService from "../../config/socket"; // <-- Import the SocketService

import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import GroupModal from "./components/GroupModal";
import UserProfile from "./components/UserProfile";
import "./styles/ChatBox.css";

const ChatBox = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [startupId, setStartupId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatType, setChatType] = useState("direct"); // 'direct' or 'group'
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);

  // Connect to socket and set up listeners when user logs in
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem("token");
    if (token) {
      SocketService.connect(token);

      // Listen for private messages
      SocketService.onNewPrivateMessage((msg) => {
        if (chatType === "direct" && activeChat && msg.senderId === activeChat.id) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      // Listen for group messages
      SocketService.onNewGroupMessage((msg) => {
        if (chatType === "group" && activeChat && msg.groupId === activeChat.id) {
          setMessages((prev) => [...prev, msg]);
        }
      });

      // Listen for user status updates
      SocketService.onUserStatusUpdate((status) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (status.online) updated.add(status.userId);
          else updated.delete(status.userId);
          return updated;
        });
      });
    }

    return () => {
      SocketService.removeAllListeners();
      SocketService.disconnect();
    };
  }, [currentUser, activeChat, chatType]);

  // Join group rooms when group chat is selected
  useEffect(() => {
    if (chatType === "group" && activeChat?.id) {
      SocketService.joinGroups([activeChat.id]);
      return () => SocketService.leaveGroup(activeChat.id);
    }
  }, [chatType, activeChat?.id]);

  // Fetch groups on component mount
  useEffect(() => {
    if (startupId) {
      // fetchGroups(); // Commented out since the function is not defined
      // fetchUsers(); // Commented out since the function is not defined
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

  useEffect(() => {
    const fetchUserAndStartup = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);

        const startups = await getMyStartups();
        if (startups && startups.length > 0) {
          setStartupId(startups[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch user or startups:", error);
      }
    };

    fetchUserAndStartup();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      setLoading(false);
      if (chatType === "direct") {
        const data = await getConversation(activeChat.id);
        setMessages(data);
      } else if (chatType === "group") {
        // Replace this with your real group fetch logic
        // const data = await getGroupMessages(activeChat.id);
        // setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // !================================================================================================================
  // useEffect(() => {
  //   // Only set interval if a chat is active and chatType is set
  //   if (!activeChat?.id || !chatType) return;

  //   fetchMessages(); // Initial fetch

  //   const interval = setInterval(fetchMessages, 2000);

  //   // Cleanup: clear interval when activeChat changes or becomes null
  //   return () => clearInterval(interval);
  // }, [activeChat?.id, chatType]);

  // ! ===============================================================================================================

  const handleChatSelect = async (chat, type) => {
    setActiveChat(chat);
    setChatType(type);
    setMessages([]);
    const token = localStorage.getItem("token");
    if (token) {
      initializeSocketConnection(token);
    }
    if (type === "direct") {
      try {
        setLoading(true);
        const data = await getConversation(chat.id);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching conversation:", error);
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

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Send message handler
  const handleSendMessage = async (content) => {
    if (!content || !activeChat) return;
    let messagePayload;
    if (chatType === "direct") {
      messagePayload = {
        receiverId: activeChat.id,
        content,
        type: "direct",
      };
      SocketService.getSocket()?.emit("send_private_message", messagePayload);
    } else if (chatType === "group") {
      messagePayload = {
        groupId: activeChat.id,
        content,
        type: "group",
      };
      SocketService.getSocket()?.emit("send_group_message", messagePayload);
    }

    // Store message in DB
    try {
      await sendMessage(messagePayload);
    } catch (error) {
      console.error("Failed to store message:", error);
      // Optionally show error to user
    }

    // Optimistically update UI
    setMessages((prev) => [
      ...prev,
      {
        senderId: currentUser.id,
        content,
        createdAt: new Date().toISOString(),
        ...(chatType === "group" ? { groupId: activeChat.id } : { receiverId: activeChat.id }),
      },
    ]);
  };

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
                    {chatType === "group" ? (
                      <div className="group-avatar">
                        <Users size={20} />
                      </div>
                    ) : (
                      <div className="user-avatar">
                        {activeChat?.name ? activeChat.name.charAt(0).toUpperCase() : ""}
                      </div>
                    )}
                  </div>
                  <div className="chat-details">
                    <h3>{activeChat?.name || ""}</h3>
                    <span className="chat-status">
                      {chatType === "group"
                        ? `${activeChat.members?.length || 0} members`
                        : onlineUsers.has(activeChat.id)
                        ? "Online"
                        : "Offline"}
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
                disabled={loading}
                receiver={activeChat}
                onSend={handleSendMessage} // <-- Pass the handler
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
            handleChatSelect(selectedUser, "direct");
            setIsUserProfileOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatBox;
