import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io('http://localhost:8080', {
      auth: {
        token
      },
      autoConnect: false
    });

    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  // Private messaging methods
  onNewPrivateMessage(callback) {
    this.socket?.on('new_private_message', callback);
  }

  onMessageSent(callback) {
    this.socket?.on('message_sent', callback);
  }

  onMessageRead(callback) {
    this.socket?.on('message_read', callback);
  }

  onUserTypingPrivate(callback) {
    this.socket?.on('user_typing_private', callback);
  }

  emitTypingPrivate(receiverId, isTyping) {
    this.socket?.emit('typing_private', { receiverId, isTyping });
  }

  // Group messaging methods
  joinGroups(groupIds) {
    this.socket?.emit('join_groups', groupIds);
  }

  leaveGroup(groupId) {
    this.socket?.emit('leave_group', groupId);
  }

  onNewGroupMessage(callback) {
    this.socket?.on('new_group_message', callback);
  }

  onUserTypingGroup(callback) {
    this.socket?.on('user_typing_group', callback);
  }

  emitTypingGroup(groupId, isTyping) {
    this.socket?.emit('typing_group', { groupId, isTyping });
  }

  // User status methods
  onUserStatusUpdate(callback) {
    this.socket?.on('user_status_update', callback);
  }

  updateStatus(status) {
    this.socket?.emit('update_status', status);
  }

  // Cleanup method
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new SocketService();