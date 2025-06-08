import { authAxios, publicAxios } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';
import socketService from '../config/socket';

// Private Message Functions

// Function to send a private message
// Request body structure:
// { receiverId: string, content: string }
export const sendMessage = async (messageData) => {
  // messageData = { receiverId, content }
  try {
    const response = await authAxios.post(API_ENDPOINTS.MESSAGES, messageData);
    return response.data; // Return the sent message data
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Function to get inbox messages
export const getInboxMessages = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.MESSAGES}/inbox`);
    return response.data; // Return the inbox messages
  } catch (error) {
    console.error('Error fewtching inbox messages:', error);
    throw error;
  }
};

// Function to get sent messages
export const getSentMessages = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.MESSAGES}/sent`);
    return response.data; // Return the sent messages
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    throw error;
  }
};

// Function to get conversation with a specific user
export const getConversation = async (userId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.MESSAGES}/conversation/${userId}`);
    return response.data; // Return the conversation messages
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

// Function to mark a message as read
export const markMessageAsRead = async (messageId) => {
  try {
    const response = await authAxios.put(`${API_ENDPOINTS.MESSAGES}/${messageId}/read`);
    return response.data; // Return the updated message
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Function to delete a message
export const deleteMessage = async (messageId) => {
  try {
    const response = await authAxios.delete(`${API_ENDPOINTS.MESSAGES}/${messageId}`);
    return response.data; // Return success message
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Function to get unread message count
export const getUnreadCount = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.MESSAGES}/unread-count`);
    return response.data; // Return unread count
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Group Message Functions

// Function to get all group chats
export const getGroupChats = async () => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.MESSAGES}/groups`);
    return response.data; // Return the group chats
  } catch (error) {
    console.error('Error fetching group chats:', error);
    throw error;
  }
};

// Function to create a new group chat
export const createGroupChat = async (groupData) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.MESSAGES}/groups`, groupData);
    return response.data; // Return the created group chat
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw error;
  }
};

// Function to get messages from a specific group
export const getGroupMessages = async (groupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.MESSAGES}/groups/${groupId}/messages`);
    return response.data; // Return the group messages
  } catch (error) {
    console.error('Error fetching group messages:', error);
    throw error;
  }
};

// Function to send a message to a group
export const sendGroupMessage = async (groupId, messageData) => {
  try {
    const response = await authAxios.post(`${API_ENDPOINTS.MESSAGES}/groups/${groupId}/messages`, messageData);
    return response.data; // Return the sent group message
  } catch (error) {
    console.error('Error sending group message:', error);
    throw error;
  }
};
// Socket-related utility functions
export const initializeSocketConnection = (token) => {
  return socketService.connect(token);
};

export const disconnectSocket = () => {
  socketService.disconnect();
};

// 
export const joinUserGroups = async () => {
  try {
    const groups = await getGroupChats();
    const groupIds = groups.map(group => group.id);
    socketService.joinGroups(groupIds);
    return groupIds;
  } catch (error) {
    console.error('Error joining user groups:', error);
    throw error;
  }
};


// Function to get members of a specific group
export const getGroupMembers = async (groupId) => {
  try {
    const response = await authAxios.get(`${API_ENDPOINTS.MESSAGES}/groups/${groupId}/members`);
    return response.data; // Return the group members
  } catch (error) {
    console.error('Error fetching group members:', error);
    throw error;
  }
};

// Additional utility functions

// Function to test message routes
export const testMessageRoutes = async () => {
  try {
    const response = await publicAxios.get(`${API_ENDPOINTS.MESSAGES}/test`);
    return response.data; // Return test response
  } catch (error) {
    console.error('Error testing message routes:', error);
    throw error;
  }
};

// Function to get all conversations (helper function)
export const getAllConversations = async () => {
  try {
    // This would get both inbox and sent messages and organize them by conversation
    const [inboxMessages, sentMessages] = await Promise.all([
      getInboxMessages(),
      getSentMessages()
    ]);
    
    // Organize messages by conversation partner
    const conversations = {};
    
    inboxMessages.forEach(message => {
      const partnerId = message.senderId;
      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partnerId,
          partnerName: message.senderName,
          partnerImage: message.senderProfileImage,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      conversations[partnerId].messages.push({
        ...message,
        direction: 'received'
      });
      
      if (!message.read) {
        conversations[partnerId].unreadCount++;
      }
      
      if (!conversations[partnerId].lastMessage || 
          new Date(message.createdAt) > new Date(conversations[partnerId].lastMessage.createdAt)) {
        conversations[partnerId].lastMessage = message;
      }
    });
    
    sentMessages.forEach(message => {
      const partnerId = message.receiverId;
      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partnerId,
          partnerName: message.receiverName,
          partnerImage: message.receiverProfileImage,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      conversations[partnerId].messages.push({
        ...message,
        direction: 'sent'
      });
      
      if (!conversations[partnerId].lastMessage || 
          new Date(message.createdAt) > new Date(conversations[partnerId].lastMessage.createdAt)) {
        conversations[partnerId].lastMessage = message;
      }
    });
    
    // Sort messages within each conversation
    Object.values(conversations).forEach(conversation => {
      conversation.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    
    // Convert to array and sort by last message time
    return Object.values(conversations).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });
  } catch (error) {
    console.error('Error getting all conversations:', error);
    throw error;
  }
};