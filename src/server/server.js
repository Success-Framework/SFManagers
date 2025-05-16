const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const ideaRoutes = require('./routes/ideas');
const startupRoutes = require('./routes/startups');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const projectRoutes = require('./routes/projects');
const { router: chatRoutes, setupWebSocketServer } = require('./routes/chat');

// Initialize express app
const app = express();

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/chat', chatRoutes);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Setup WebSocket server for chat
const wss = setupWebSocketServer(server); 