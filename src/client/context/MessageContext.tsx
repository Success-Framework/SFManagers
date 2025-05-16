import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Define the shape of message objects
interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  read: boolean;
  direction: 'sent' | 'received';
}

// Define the shape of a conversation
interface Conversation {
  userId: string;
  userName: string;
  userImage?: string;
  lastMessage?: string;
  lastUpdated: Date;
  unreadCount: number;
}

interface MessageContextType {
  conversations: Conversation[];
  currentConversation: Message[];
  sentMessages: Message[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadInitialData: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchConversation: (userId: string) => Promise<void>;
  fetchSent: () => Promise<void>;
  sendMessage: (recipientId: string, content: string) => Promise<boolean>;
  markAsRead: (userId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<boolean>;
}

// Sample data for development and fallback
const sampleConversations: Conversation[] = [
  {
    userId: '1',
    userName: 'John Doe',
    userImage: 'default.jpg',
    lastMessage: 'Hey, how are you doing?',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    unreadCount: 2
  },
  {
    userId: '2',
    userName: 'Jane Smith',
    lastMessage: 'Can we schedule a meeting tomorrow?',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    unreadCount: 0
  },
  {
    userId: '3',
    userName: 'Mark Johnson',
    userImage: 'mark.jpg',
    lastMessage: 'The project looks great!',
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    unreadCount: 1
  }
];

const sampleMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '101',
      content: 'Hey there!',
      senderId: '1',
      recipientId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      read: true,
      direction: 'received'
    },
    {
      id: '102',
      content: 'Hi John, how are you?',
      senderId: 'current-user',
      recipientId: '1',
      createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      read: true,
      direction: 'sent'
    },
    {
      id: '103',
      content: "I'm doing well, thanks for asking!",
      senderId: '1',
      recipientId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      read: true,
      direction: 'received'
    },
    {
      id: '104',
      content: 'Hey, how are you doing?',
      senderId: '1',
      recipientId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read: false,
      direction: 'received'
    }
  ],
  '2': [
    {
      id: '201',
      content: 'Hello, can we schedule a meeting?',
      senderId: '2',
      recipientId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      read: true,
      direction: 'received'
    },
    {
      id: '202',
      content: 'Sure, what time works for you?',
      senderId: 'current-user',
      recipientId: '2',
      createdAt: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
      read: true,
      direction: 'sent'
    },
    {
      id: '203',
      content: 'Can we schedule a meeting tomorrow?',
      senderId: '2',
      recipientId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read: true,
      direction: 'received'
    }
  ],
  '3': [
    {
      id: '301',
      content: 'Just reviewed the project',
      senderId: '3',
      recipientId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      read: true,
      direction: 'received'
    },
    {
      id: '302',
      content: 'What did you think?',
      senderId: 'current-user',
      recipientId: '3',
      createdAt: new Date(Date.now() - 1000 * 60 * 179).toISOString(),
      read: true,
      direction: 'sent'
    },
    {
      id: '303',
      content: 'The project looks great!',
      senderId: '3',
      recipientId: 'current-user',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      read: false,
      direction: 'received'
    }
  ]
};

// Create context with default value
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Define the provider component
export const MessageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Check API availability
  const checkApiAvailability = useCallback(async () => {
    if (!token) return false;
    
    try {
      const response = await axios.get('/api/messages/test', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiAvailable(true);
      return true;
    } catch (err) {
      console.warn('Messaging API unavailable, using sample data');
      setApiAvailable(false);
      return false;
    }
  }, [token]);

  // Load initial data including unread count and conversations
  const loadInitialData = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    // First check if API is available
    const isApiAvailable = await checkApiAvailability();
    
    try {
      if (isApiAvailable) {
        // Try to load from real API
        const unreadResponse = await axios.get('/api/messages/unread-count', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(unreadResponse.data?.count || 0);
        
        const inboxResponse = await axios.get('/api/messages/inbox', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (inboxResponse.data?.length > 0) {
          // Transform API response to conversation format
          const apiConversations = inboxResponse.data.map((msg: any) => ({
            userId: msg.senderId,
            userName: msg.senderName || 'Unknown User',
            userImage: msg.senderProfileImage,
            lastMessage: msg.content,
            lastUpdated: new Date(msg.createdAt),
            unreadCount: msg.read ? 0 : 1
          }));
          
          // Group by user and count unread
          const conversationMap = new Map<string, Conversation>();
          
          apiConversations.forEach((conv: Conversation) => {
            if (conversationMap.has(conv.userId)) {
              const existing = conversationMap.get(conv.userId)!;
              // Keep the most recent message
              if (conv.lastUpdated > existing.lastUpdated) {
                existing.lastMessage = conv.lastMessage;
                existing.lastUpdated = conv.lastUpdated;
              }
              // Add to unread count
              existing.unreadCount += conv.unreadCount;
            } else {
              conversationMap.set(conv.userId, conv);
            }
          });
          
          setConversations(Array.from(conversationMap.values()));
        } else {
          // Fallback to sample data if API returns empty
          setConversations(sampleConversations);
        }
      } else {
        // Use sample data when API is unavailable
        setUnreadCount(sampleConversations.reduce((total, conv) => total + conv.unreadCount, 0));
        setConversations(sampleConversations);
      }
    } catch (err) {
      console.error('Error loading initial message data:', err);
      setError('Failed to load messages');
      
      // Fallback to sample data
      setUnreadCount(sampleConversations.reduce((total, conv) => total + conv.unreadCount, 0));
      setConversations(sampleConversations);
    } finally {
      setIsLoading(false);
    }
  }, [token, checkApiAvailability]);

  // Fetch conversation list
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isApiAvailable = apiAvailable !== null ? apiAvailable : await checkApiAvailability();
      
      if (isApiAvailable) {
        // Try using the real API
        const response = await axios.get('/api/messages/inbox', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data?.length > 0) {
          // Transform API response to conversation format
          const apiConversations = response.data.map((msg: any) => ({
            userId: msg.senderId,
            userName: msg.senderName || 'Unknown User',
            userImage: msg.senderProfileImage,
            lastMessage: msg.content,
            lastUpdated: new Date(msg.createdAt),
            unreadCount: msg.read ? 0 : 1
          }));
          
          // Group by user and count unread
          const conversationMap = new Map<string, Conversation>();
          
          apiConversations.forEach((conv: Conversation) => {
            if (conversationMap.has(conv.userId)) {
              const existing = conversationMap.get(conv.userId)!;
              // Keep the most recent message
              if (conv.lastUpdated > existing.lastUpdated) {
                existing.lastMessage = conv.lastMessage;
                existing.lastUpdated = conv.lastUpdated;
              }
              // Add to unread count
              existing.unreadCount += conv.unreadCount;
            } else {
              conversationMap.set(conv.userId, conv);
            }
          });
          
          setConversations(Array.from(conversationMap.values()));
        } else {
          // Fallback to sample data if API returns empty
          setConversations(sampleConversations);
        }
      } else {
        // Use sample data
        setConversations(sampleConversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      
      // Fallback to sample data
      setConversations(sampleConversations);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiAvailable, checkApiAvailability]);

  // Function to mark messages as read
  const markAsRead = useCallback(async (userId: string) => {
    if (!token) return Promise.resolve();
    
    try {
      const isApiAvailable = apiAvailable !== null ? apiAvailable : await checkApiAvailability();
      
      if (isApiAvailable) {
        // Try using the real API
        await axios.post(`/api/messages/read/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Calculate unread messages count first
      const unreadCount = currentConversation.filter(msg => 
        msg.direction === 'received' && !msg.read
      ).length;
      
      // Update local state regardless of API availability
      setCurrentConversation(prev => {
        // Mark all as read
        return prev.map(msg => 
          msg.direction === 'received' && !msg.read
            ? { ...msg, read: true }
            : msg
        );
      });
      
      // Update unread count
      setConversations(prev => {
        // Update unread count
        setUnreadCount(count => Math.max(0, count - unreadCount));
        
        // Update the conversation
        return prev.map(c => 
          c.userId === userId
            ? { ...c, unreadCount: 0 }
            : c
        );
      });
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error marking messages as read:', err);
      // Don't set error state here, as this is a background operation
      return Promise.reject('Failed to mark messages as read');
    }
  }, [token, apiAvailable, checkApiAvailability]);

  // Fetch a single conversation
  const fetchConversation = useCallback(async (userId: string) => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isApiAvailable = apiAvailable !== null ? apiAvailable : await checkApiAvailability();
      
      if (isApiAvailable) {
        // Try using the real API
        // This endpoint might need to be created on the server
        const response = await axios.get(`/api/messages/conversation/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data?.length > 0) {
          const messages = response.data.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            createdAt: msg.createdAt,
            read: msg.read,
            direction: msg.senderId === userId ? 'received' : 'sent'
          }));
          
          setCurrentConversation(messages);
          
          // Mark messages as read
          markAsRead(userId);
        } else {
          // Use sample data if API returns empty
          setCurrentConversation(sampleMessages[userId] || []);
        }
      } else {
        // Use sample data
        setCurrentConversation(sampleMessages[userId] || []);
      }
    } catch (err) {
      console.error(`Error fetching conversation with user ${userId}:`, err);
      setError('Failed to load conversation');
      
      // Fallback to sample data
      setCurrentConversation(sampleMessages[userId] || []);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiAvailable, checkApiAvailability, markAsRead]);

  // Fetch sent messages
  const fetchSent = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isApiAvailable = apiAvailable !== null ? apiAvailable : await checkApiAvailability();
      
      if (isApiAvailable) {
        // Try using the real API
        const response = await axios.get('/api/messages/sent', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data?.length > 0) {
          const messages = response.data.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId || 'current-user',
            recipientId: msg.recipientId,
            createdAt: msg.createdAt,
            read: msg.read || false,
            direction: 'sent'
          }));
          
          setSentMessages(messages);
        } else {
          // Use sample data if API returns empty
          // Create sample sent messages based on conversations
          const sampleSent = Object.values(sampleMessages)
            .flat()
            .filter(msg => msg.direction === 'sent');
          
          setSentMessages(sampleSent);
        }
      } else {
        // Use sample data
        const sampleSent = Object.values(sampleMessages)
          .flat()
          .filter(msg => msg.direction === 'sent');
        
        setSentMessages(sampleSent);
      }
    } catch (err) {
      console.error('Error fetching sent messages:', err);
      setError('Failed to load sent messages');
      
      // Fallback to sample data
      const sampleSent = Object.values(sampleMessages)
        .flat()
        .filter(msg => msg.direction === 'sent');
      
      setSentMessages(sampleSent);
    } finally {
      setIsLoading(false);
    }
  }, [token, apiAvailable, checkApiAvailability]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!token) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isApiAvailable = apiAvailable !== null ? apiAvailable : await checkApiAvailability();
      
      if (isApiAvailable) {
        // Try using the real API
        await axios.delete(`/api/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Update local state by removing the message
      setSentMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Also remove from current conversation if present
      setCurrentConversation(prev => prev.filter(msg => msg.id !== messageId));
      
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, apiAvailable, checkApiAvailability]);

  // Send a message - update to return boolean for success/failure
  const sendMessage = useCallback(async (recipientId: string, content: string) => {
    if (!token || !content.trim()) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isApiAvailable = apiAvailable !== null ? apiAvailable : await checkApiAvailability();
      
      if (isApiAvailable) {
        // Try using the real API
        const response = await axios.post('/api/messages/send', 
          { recipientId, content },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data) {
          // If successful, add new message to current conversation
          const newMessage: Message = {
            id: response.data.id || `temp-${Date.now()}`,
            content,
            senderId: 'current-user', // This should be the actual user ID
            recipientId,
            createdAt: new Date().toISOString(),
            read: false,
            direction: 'sent'
          };
          
          setCurrentConversation(prev => [...prev, newMessage]);
          
          // Also add to sent messages
          setSentMessages(prev => [...prev, newMessage]);
          
          // Update conversations list
          setConversations(prev => {
            const existingConversation = prev.find(c => c.userId === recipientId);
            
            if (existingConversation) {
              // Update existing conversation
              return prev.map(c => 
                c.userId === recipientId 
                  ? {
                      ...c,
                      lastMessage: content,
                      lastUpdated: new Date()
                    }
                  : c
              );
            } else {
              // Add new conversation (this would need user info from elsewhere)
              const newConversation: Conversation = {
                userId: recipientId,
                userName: 'User', // Placeholder
                lastMessage: content,
                lastUpdated: new Date(),
                unreadCount: 0
              };
              
              return [...prev, newConversation];
            }
          });
          
          return true;
        }
      } else {
        // Simulate sending with sample data
        const newMessage: Message = {
          id: `temp-${Date.now()}`,
          content,
          senderId: 'current-user',
          recipientId,
          createdAt: new Date().toISOString(),
          read: false,
          direction: 'sent'
        };
        
        setCurrentConversation(prev => [...prev, newMessage]);
        
        // Also add to sent messages
        setSentMessages(prev => [...prev, newMessage]);
        
        // Update conversations list
        setConversations(prev => {
          const existingConversation = prev.find(c => c.userId === recipientId);
          
          if (existingConversation) {
            // Update existing conversation
            return prev.map(c => 
              c.userId === recipientId 
                ? {
                    ...c,
                    lastMessage: content,
                    lastUpdated: new Date()
                  }
                : c
            );
          } else {
            // Find user info from sample data or create placeholder
            const userData = sampleConversations.find(c => c.userId === recipientId);
            
            const newConversation: Conversation = {
              userId: recipientId,
              userName: userData?.userName || 'User',
              userImage: userData?.userImage,
              lastMessage: content,
              lastUpdated: new Date(),
              unreadCount: 0
            };
            
            return [...prev, newConversation];
          }
        });
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token, apiAvailable, checkApiAvailability]);

  // Provide the context value
  const contextValue: MessageContextType = {
    conversations,
    currentConversation,
    sentMessages,
    unreadCount,
    isLoading,
    error,
    loadInitialData,
    fetchConversations,
    fetchConversation,
    fetchSent,
    sendMessage,
    markAsRead,
    deleteMessage
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

// Hook for using the context
export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}; 