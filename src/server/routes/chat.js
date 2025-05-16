const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const Startup = require('../models/Startup');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('config');

// In-memory storage of active connections
const connections = new Map(); // userId -> ws connection
const startupSubscriptions = new Map(); // startupId -> Set of userIds

// Setup WebSocket server
function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ noServer: true });
    
    // Handle upgrade
    server.on('upgrade', (request, socket, head) => {
        const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
        
        if (pathname === '/ws/chat') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });
    
    // Connection handling
    wss.on('connection', (ws, request) => {
        let userId = null;
        let isAlive = true;
        
        // Handle ping/pong for connection health
        ws.on('pong', () => { isAlive = true; });
        
        const interval = setInterval(() => {
            if (!isAlive) {
                terminateConnection();
                return;
            }
            
            isAlive = false;
            ws.ping(() => {});
        }, 30000);
        
        function terminateConnection() {
            clearInterval(interval);
            
            if (userId) {
                connections.delete(userId);
                
                // Remove from all startup subscriptions
                for (const [startupId, subscribers] of startupSubscriptions.entries()) {
                    subscribers.delete(userId);
                    if (subscribers.size === 0) {
                        startupSubscriptions.delete(startupId);
                    }
                }
            }
            
            ws.terminate();
        }
        
        // Process authentication
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data);
                
                // Handle authentication
                if (message.type === 'auth') {
                    try {
                        const decoded = jwt.verify(message.token, config.get('jwtSecret'));
                        userId = decoded.user.id;
                        
                        // Store connection
                        connections.set(userId, ws);
                        
                        // Send acknowledgement
                        ws.send(JSON.stringify({
                            type: 'auth_success',
                            userId
                        }));
                        
                        // Check for unread messages
                        const unreadCount = await Message.countDocuments({
                            recipient: userId,
                            read: false
                        });
                        
                        if (unreadCount > 0) {
                            ws.send(JSON.stringify({
                                type: 'unread_messages',
                                count: unreadCount
                            }));
                        }
                        
                    } catch (err) {
                        ws.send(JSON.stringify({
                            type: 'auth_error',
                            message: 'Invalid token'
                        }));
                    }
                    return;
                }
                
                // Require authentication for all other message types
                if (!userId) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Authentication required'
                    }));
                    return;
                }
                
                // Handle direct message
                if (message.type === 'direct_message') {
                    const { recipientId, content } = message;
                    
                    // Validate recipient exists
                    const recipient = await User.findById(recipientId);
                    if (!recipient) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Recipient not found'
                        }));
                        return;
                    }
                    
                    // Save to database
                    const newMessage = new Message({
                        sender: userId,
                        recipient: recipientId,
                        content,
                        messageType: 'direct'
                    });
                    
                    await newMessage.save();
                    
                    // Populate sender info
                    await newMessage.populate('sender', 'name avatar');
                    
                    // Send to recipient if online
                    const recipientWs = connections.get(recipientId);
                    if (recipientWs) {
                        recipientWs.send(JSON.stringify({
                            type: 'new_direct_message',
                            message: newMessage
                        }));
                    }
                    
                    // Send confirmation to sender
                    ws.send(JSON.stringify({
                        type: 'message_sent',
                        message: newMessage
                    }));
                    
                    return;
                }
                
                // Handle startup message
                if (message.type === 'startup_message') {
                    const { startupId, content } = message;
                    
                    // Validate startup exists and user is member
                    const startup = await Startup.findById(startupId);
                    if (!startup) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Startup not found'
                        }));
                        return;
                    }
                    
                    // Check if user is member of startup
                    const isMember = startup.members.some(member => 
                        member.user.toString() === userId.toString()
                    );
                    
                    if (!isMember && startup.founder.toString() !== userId.toString()) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You are not a member of this startup'
                        }));
                        return;
                    }
                    
                    // Save to database
                    const newMessage = new Message({
                        sender: userId,
                        startup: startupId,
                        content,
                        messageType: 'startup'
                    });
                    
                    await newMessage.save();
                    
                    // Populate sender info
                    await newMessage.populate('sender', 'name avatar');
                    
                    // Subscribe sender to startup channel if not already
                    if (!startupSubscriptions.has(startupId)) {
                        startupSubscriptions.set(startupId, new Set());
                    }
                    startupSubscriptions.get(startupId).add(userId);
                    
                    // Send to all subscribed members
                    const subscribers = startupSubscriptions.get(startupId) || new Set();
                    
                    // Find all startup members to notify
                    const memberIds = [
                        startup.founder.toString(),
                        ...startup.members.map(member => member.user.toString())
                    ];
                    
                    // Notify all online members
                    for (const memberId of memberIds) {
                        if (memberId === userId) continue; // Skip sender
                        
                        const memberWs = connections.get(memberId);
                        if (memberWs) {
                            memberWs.send(JSON.stringify({
                                type: 'new_startup_message',
                                message: newMessage
                            }));
                            
                            // Add them to subscribers for future messages
                            subscribers.add(memberId);
                        }
                    }
                    
                    // Send confirmation to sender
                    ws.send(JSON.stringify({
                        type: 'message_sent',
                        message: newMessage
                    }));
                    
                    return;
                }
                
                // Handle typing indicator
                if (message.type === 'typing') {
                    const { recipientId, startupId, isTyping } = message;
                    
                    if (recipientId) {
                        // Direct message typing indicator
                        const recipientWs = connections.get(recipientId);
                        if (recipientWs) {
                            recipientWs.send(JSON.stringify({
                                type: 'typing_indicator',
                                userId,
                                isTyping
                            }));
                        }
                    } else if (startupId) {
                        // Startup message typing indicator
                        const subscribers = startupSubscriptions.get(startupId) || new Set();
                        
                        for (const subscriberId of subscribers) {
                            if (subscriberId === userId) continue; // Skip sender
                            
                            const subscriberWs = connections.get(subscriberId);
                            if (subscriberWs) {
                                subscriberWs.send(JSON.stringify({
                                    type: 'typing_indicator',
                                    userId,
                                    startupId,
                                    isTyping
                                }));
                            }
                        }
                    }
                    
                    return;
                }
                
                // Handle subscription to startup channel
                if (message.type === 'subscribe_startup') {
                    const { startupId } = message;
                    
                    // Check if startup exists
                    const startup = await Startup.findById(startupId);
                    if (!startup) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Startup not found'
                        }));
                        return;
                    }
                    
                    // Check if user is member of startup
                    const isMember = startup.members.some(member => 
                        member.user.toString() === userId.toString()
                    );
                    
                    if (!isMember && startup.founder.toString() !== userId.toString()) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'You are not a member of this startup'
                        }));
                        return;
                    }
                    
                    // Add to startup subscribers
                    if (!startupSubscriptions.has(startupId)) {
                        startupSubscriptions.set(startupId, new Set());
                    }
                    startupSubscriptions.get(startupId).add(userId);
                    
                    ws.send(JSON.stringify({
                        type: 'subscribed',
                        startupId
                    }));
                    
                    return;
                }
                
                // Handle unsubscription from startup channel
                if (message.type === 'unsubscribe_startup') {
                    const { startupId } = message;
                    
                    if (startupSubscriptions.has(startupId)) {
                        startupSubscriptions.get(startupId).delete(userId);
                        
                        if (startupSubscriptions.get(startupId).size === 0) {
                            startupSubscriptions.delete(startupId);
                        }
                    }
                    
                    ws.send(JSON.stringify({
                        type: 'unsubscribed',
                        startupId
                    }));
                    
                    return;
                }
                
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Error processing message'
                }));
            }
        });
        
        // Handle connection close
        ws.on('close', () => {
            terminateConnection();
        });
    });
    
    return wss;
}

// RESTful routes

// @route   GET api/chat/direct/:userId
// @desc    Get direct messages between current user and another user
// @access  Private
router.get('/direct/:userId', auth, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;
        
        // Validate other user exists
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        // Get messages between the two users
        const messages = await Message.find({
            messageType: 'direct',
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        })
        .sort('createdAt')
        .populate('sender', 'name avatar');
        
        // Mark messages as read
        await Message.updateMany(
            { sender: otherUserId, recipient: currentUserId, read: false },
            { read: true }
        );
        
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chat/direct/:userId
// @desc    Send a direct message to a user
// @access  Private
router.post('/direct/:userId', auth, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const recipientId = req.params.userId;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ msg: 'Message content is required' });
        }
        
        // Validate recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        const newMessage = new Message({
            sender: currentUserId,
            recipient: recipientId,
            content,
            messageType: 'direct'
        });
        
        await newMessage.save();
        await newMessage.populate('sender', 'name avatar');
        
        // Send message via WebSocket if recipient is online
        const recipientWs = connections.get(recipientId);
        if (recipientWs) {
            recipientWs.send(JSON.stringify({
                type: 'new_direct_message',
                message: newMessage
            }));
        }
        
        res.json(newMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chat/startup/:startupId
// @desc    Get messages for a startup
// @access  Private
router.get('/startup/:startupId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const startupId = req.params.startupId;
        
        // Validate startup exists
        const startup = await Startup.findById(startupId);
        if (!startup) {
            return res.status(404).json({ msg: 'Startup not found' });
        }
        
        // Check if user is member of startup
        const isMember = startup.members.some(member => 
            member.user.toString() === userId.toString()
        );
        
        if (!isMember && startup.founder.toString() !== userId.toString()) {
            return res.status(403).json({ msg: 'Not authorized to view these messages' });
        }
        
        // Get messages for startup
        const messages = await Message.find({
            startup: startupId,
            messageType: 'startup'
        })
        .sort('createdAt')
        .populate('sender', 'name avatar');
        
        // Add user to startup subscribers if using WebSockets
        if (connections.has(userId)) {
            if (!startupSubscriptions.has(startupId)) {
                startupSubscriptions.set(startupId, new Set());
            }
            startupSubscriptions.get(startupId).add(userId);
        }
        
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chat/startup/:startupId
// @desc    Send a message to a startup chat
// @access  Private
router.post('/startup/:startupId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const startupId = req.params.startupId;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ msg: 'Message content is required' });
        }
        
        // Validate startup exists
        const startup = await Startup.findById(startupId);
        if (!startup) {
            return res.status(404).json({ msg: 'Startup not found' });
        }
        
        // Check if user is member of startup
        const isMember = startup.members.some(member => 
            member.user.toString() === userId.toString()
        );
        
        if (!isMember && startup.founder.toString() !== userId.toString()) {
            return res.status(403).json({ msg: 'Not authorized to send messages to this startup' });
        }
        
        const newMessage = new Message({
            sender: userId,
            startup: startupId,
            content,
            messageType: 'startup'
        });
        
        await newMessage.save();
        await newMessage.populate('sender', 'name avatar');
        
        // Subscribe sender to startup channel if not already
        if (!startupSubscriptions.has(startupId)) {
            startupSubscriptions.set(startupId, new Set());
        }
        startupSubscriptions.get(startupId).add(userId);
        
        // Notify all online members via WebSocket
        const memberIds = [
            startup.founder.toString(),
            ...startup.members.map(member => member.user.toString())
        ];
        
        for (const memberId of memberIds) {
            if (memberId === userId) continue; // Skip sender
            
            const memberWs = connections.get(memberId);
            if (memberWs) {
                memberWs.send(JSON.stringify({
                    type: 'new_startup_message',
                    message: newMessage
                }));
                
                // Add them to subscribers for future messages
                startupSubscriptions.get(startupId).add(memberId);
            }
        }
        
        res.json(newMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/chat/read/:messageId
// @desc    Mark a message as read
// @access  Private
router.put('/read/:messageId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const messageId = req.params.messageId;
        
        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }
        
        // Check if user is the recipient
        if (message.messageType === 'direct' && message.recipient.toString() !== userId) {
            return res.status(403).json({ msg: 'Not authorized to mark this message as read' });
        }
        
        // For startup messages, check if user is member
        if (message.messageType === 'startup') {
            const startup = await Startup.findById(message.startup);
            
            if (!startup) {
                return res.status(404).json({ msg: 'Startup not found' });
            }
            
            const isMember = startup.members.some(member => 
                member.user.toString() === userId.toString()
            );
            
            if (!isMember && startup.founder.toString() !== userId) {
                return res.status(403).json({ msg: 'Not authorized to mark this message as read' });
            }
        }
        
        message.read = true;
        await message.save();
        
        res.json({ msg: 'Message marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chat/users
// @desc    Get users who have direct message history with current user
// @access  Private
router.get('/users', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find unique users who have messaged with current user
        const messagePartners = await Message.aggregate([
            {
                $match: {
                    messageType: 'direct',
                    $or: [
                        { sender: mongoose.Types.ObjectId(userId) },
                        { recipient: mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    partners: { 
                        $addToSet: { 
                            $cond: [
                                { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
                                '$recipient',
                                '$sender'
                            ]
                        }
                    }
                }
            }
        ]);
        
        if (messagePartners.length === 0 || !messagePartners[0].partners.length) {
            return res.json([]);
        }
        
        // Get user details for each partner
        const users = await User.find({
            _id: { $in: messagePartners[0].partners }
        }).select('name avatar email');
        
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Export both router and WebSocket setup
module.exports = {
    router,
    setupWebSocketServer
}; 