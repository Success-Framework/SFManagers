const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate a JWT token manually for authentication with the correct user fields
// Using a real user ID from the database and including the roles array
const user = { 
  // Auth middleware expects userId or user.id in the token
  userId: '832af297-0a45-4261-9cab-a99cd537e7f1', // Use 'userId' field which auth middleware checks first
  // Also include id to match any other checks
  id: '832af297-0a45-4261-9cab-a99cd537e7f1', 
  email: 'test@example.com',
  name: 'Test User',
  // Include roles array as seen in server logs
  roles: [
    {
      startupId: '40864824-84c0-4afe-bdb8-e3ae97259f55',
      role: 'member'
    }
  ],
  iat: Math.floor(Date.now() / 1000)
};
const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

// Log the token for debugging
console.log('Token:', token);

// Setup for testing endpoints
const authConfig = { headers: { 'x-auth-token': token } };
const baseUrl = 'http://localhost:3000/api'; 
const startupId = '40864824-84c0-4afe-bdb8-e3ae97259f55'; // Real startup ID from database

// Test 1: Get all discussions for a startup
async function getAllDiscussions() {
  try {
    console.log('\n===== Testing GET /api/startups/:startup_id/discussions =====');
    // URL path needed to access discussion routes from client
    // The server mounts discussion routes at /api/startups/:startup_id/discussions
    const response = await axios.get(`${baseUrl}/startups/${startupId}/discussions`, authConfig);
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 300) + '...');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

// Test 2: Create a new discussion
async function createDiscussion() {
  try {
    console.log('\n===== Testing POST /api/startups/:startup_id/discussions =====');
    const newDiscussion = {
      title: 'Test Discussion ' + new Date().toISOString(),
      content: 'This is a test discussion created via API test'
    };
    
    const response = await axios.post(
      `${baseUrl}/startups/${startupId}/discussions`, 
      newDiscussion, 
      authConfig
    );
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data.id; // Return discussion ID for further tests
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
    return null;
  }
}

// Test 3: Get a single discussion with comments
async function getDiscussion(discussionId) {
  if (!discussionId) return;
  
  try {
    console.log(`\n===== Testing GET /api/startups/:startup_id/discussions/:discussion_id =====`);
    const response = await axios.get(
      `${baseUrl}/startups/${startupId}/discussions/${discussionId}`, 
      authConfig
    );
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

// Test 4: Add a comment to a discussion
async function addComment(discussionId) {
  if (!discussionId) return;
  
  try {
    console.log(`\n===== Testing POST /api/startups/:startup_id/discussions/:discussion_id/comments =====`);
    const comment = {
      content: 'Test comment ' + new Date().toISOString()
    };
    
    const response = await axios.post(
      `${baseUrl}/startups/${startupId}/discussions/${discussionId}/comments`, 
      comment, 
      authConfig
    );
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  await getAllDiscussions();
  const discussionId = await createDiscussion();
  if (discussionId) {
    await getDiscussion(discussionId);
    await addComment(discussionId);
  }
  console.log('\n===== API Tests Completed =====');
}

runTests(); 