const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const auth = require('./middleware/auth');

// Import routes
const startupRoutes = require('./routes/startup.routes');
const authRoutes = require('./routes/auth.routes');
const joinRequestRoutes = require('./routes/join-request.routes');
const taskRoutes = require('./routes/task.routes');
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const affiliateRoutes = require('./routes/affiliate.routes');
const affiliateLinksRoutes = require('./routes/affiliate-links.routes');
const affiliateClicksRoutes = require('./routes/affiliate-clicks.routes');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add debug logging for all requests
app.use((req, res, next) => {
  console.log('\n=== Request Debug Info ===');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Base URL:', req.baseUrl);
  console.log('Original URL:', req.originalUrl);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('=== End Debug Info ===\n');
  next();
});

// Log all registered routes
const listRoutes = () => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  console.log('\n=== Registered Routes ===');
  routes.forEach((route) => {
    console.log(`${route.methods.join(', ').toUpperCase()}\t${route.path}`);
  });
  console.log('=== End Routes ===\n');
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/affiliate-links', affiliateLinksRoutes);
app.use('/api/affiliate-clicks', affiliateClicksRoutes);

// Create a router for startup-related routes
const startupRouter = express.Router();

// Debug middleware for startup router
startupRouter.use((req, res, next) => {
  console.log('\n=== Startup Router Debug ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('OriginalURL:', req.originalUrl);
  console.log('BaseURL:', req.baseUrl);
  console.log('Path:', req.path);
  console.log('Params:', req.params);
  console.log('=== End Startup Router Debug ===\n');
  next();
});

// Mount startup routes at the root level
console.log('Mounting startup routes at root level of startupRouter');
startupRouter.use('/', startupRoutes);

// Mount the startup router to the main app
console.log('Mounting the startupRouter at /api/startups');
app.use('/api/startups', startupRouter);

// Log all routes after setup
listRoutes();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== Error Handler ===');
  console.error('Error:', err.stack);
  console.error('=== End Error Handler ===\n');
  res.status(500).json({ 
    message: 'Something broke!',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log('\n=== 404 Handler ===');
  console.log('404 - Not Found:', {
    method: req.method,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    path: req.path,
    params: req.params
  });
  console.log('=== End 404 Handler ===\n');
  res.status(404).json({ 
    message: 'Not Found',
    path: req.url,
    method: req.method,
    params: req.params
  });
});

module.exports = app; 