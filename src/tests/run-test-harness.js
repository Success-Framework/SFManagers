const express = require('express');
const path = require('path');
const app = express();
const port = 3001;

// Serve static files from the tests directory
app.use(express.static(path.join(__dirname)));

// Serve the test harness HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'tracker-test-harness.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Test harness server running at http://localhost:${port}`);
  console.log(`Open your browser to http://localhost:${port} to view the test harness`);
});
