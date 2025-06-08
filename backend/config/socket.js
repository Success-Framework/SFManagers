import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../database.js';

let io;

// Allowed origins for Socket.IO CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'https://sfmanagers.com',
  'https://api.sfmanagers.com',
  'http://api.sfmanagers.com',
  'http://sfmanagers.com'
];

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.findOne('User', { id: decoded.id });
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected with socket ID: ${socket.id}`);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Handle joining group chats
    socket.on('join_groups', async (groupIds) => {
      try {
        for (const groupId of groupIds) {
          // Verify user is member of the group
          const membership = await db.findOne('GroupChatMember', {
            groupId,
            userId: socket.userId
          });
          
          if (membership) {
            socket.join(`group_${groupId}`);
            console.log(`User ${socket.user.name} joined group ${groupId}`);
          }
        }
      } catch (error) {
        console.error('Error joining groups:', error);
      }
    });

    // Handle leaving group chats
    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
      console.log(`User ${socket.user.name} left group ${groupId}`);
    });

    // Handle typing indicators for private messages
    socket.on('typing_private', ({ receiverId, isTyping }) => {
      socket.to(`user_${receiverId}`).emit('user_typing_private', {
        senderId: socket.userId,
        senderName: socket.user.name,
        isTyping
      });
    });

    // Handle typing indicators for group messages
    socket.on('typing_group', ({ groupId, isTyping }) => {
      socket.to(`group_${groupId}`).emit('user_typing_group', {
        senderId: socket.userId,
        senderName: socket.user.name,
        isTyping,
        groupId
      });
    });

    // Handle user status updates
    socket.on('update_status', (status) => {
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status: 'offline'
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export { io };