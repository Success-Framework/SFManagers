// Simple test for MySQL connection
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testMySQLConnection() {
  // Create connection using MySQL connection info from .env
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  console.log('MySQL Connection established successfully!');
  
  // Test query to verify we can interact with the database
  const [rows] = await connection.query('SELECT COUNT(*) as count FROM users');
  console.log(`Number of users in the database: ${rows[0].count}`);
  
  // Close the connection
  await connection.end();
  console.log('Connection closed');
}

// Run the test
testMySQLConnection()
  .then(() => console.log('MySQL test completed successfully!'))
  .catch(err => {
    console.error('MySQL connection test failed:');
    console.error(err);
  }); 