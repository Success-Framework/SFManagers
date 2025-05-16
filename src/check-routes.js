const fs = require('fs');
const path = require('path');

// Check if message.routes.js exists in the routes directory
const routesDir = path.join(__dirname, 'routes');
console.log('Routes directory exists:', fs.existsSync(routesDir));

// List all files in the routes directory
if (fs.existsSync(routesDir)) {
  const files = fs.readdirSync(routesDir);
  console.log('Files in routes directory:', files);
  
  // Check for message.routes.js specifically
  const messageRoutesPath = path.join(routesDir, 'message.routes.js');
  console.log('message.routes.js exists:', fs.existsSync(messageRoutesPath));
  
  if (fs.existsSync(messageRoutesPath)) {
    console.log('message.routes.js file size:', fs.statSync(messageRoutesPath).size, 'bytes');
  }
}

// Test requiring the message routes
try {
  const messageRoutes = require('./routes/message.routes.js');
  console.log('Message routes required successfully:', typeof messageRoutes);
} catch (error) {
  console.error('Error requiring message routes:', error);
}

console.log('Check complete'); 