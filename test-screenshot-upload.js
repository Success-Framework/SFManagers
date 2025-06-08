const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Create a test file
const testFilePath = path.join(__dirname, 'test-screenshot.txt');
fs.writeFileSync(testFilePath, 'This is a test screenshot file');

// Create form data
const formData = new FormData();
formData.append('screenshot', fs.createReadStream(testFilePath));
formData.append('metadata', JSON.stringify({
  startupId: 'test-startup',
  userId: 'test-user',
  userName: 'Test User',
  timestamp: new Date().toISOString()
}));

console.log('Sending test file to /api/tracker/test-upload endpoint...');

// Send the test file to the test-upload endpoint
axios.post('http://localhost:5000/api/tracker/test-upload', formData, {
  headers: {
    ...formData.getHeaders()
  }
})
.then(response => {
  console.log('Test upload successful!');
  console.log('Response:', response.data);
})
.catch(error => {
  console.error('Test upload failed!');
  console.error('Error:', error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }
})
.finally(() => {
  // Clean up the test file
  fs.unlinkSync(testFilePath);
  console.log('Test file cleaned up');
});
