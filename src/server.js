// API Routes
app.use('/api/startups', startupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/affiliate', affiliateRoutes);
// Modified route imports for affiliate-links and affiliate-clicks
const affiliateLinksRoutes = require('./routes/affiliate-links.routes.js');
const affiliateClicksRoutes = require('./routes/affiliate-clicks.routes.js');
app.use('/api/affiliate-links', affiliateLinksRoutes);
app.use('/api/affiliate-clicks', affiliateClicksRoutes); 