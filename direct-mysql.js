// A standalone script that uses the MySQL driver directly
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  let connection;
  
  try {
    // Example of using the API key from environment variables
    const apiKey = process.env.API_KEY;
    console.log('API Key is configured');
    
    // Create a direct MySQL connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'hdadmin_sfm',
      password: process.env.DB_PASSWORD || '25Y7Pwsd6UKEh4kTEsAC',
      database: process.env.DB_NAME || 'hdadmin_sfm'
    });
    
    // Query the database using the correct table name
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM User');
    console.log(`Number of users in the database: ${rows[0].count}`);
    
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return { success: false, message: error.message };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run main function and keep the process alive
main()
  .then(result => {
    console.log(result);
    // Keep the process alive indefinitely
    setInterval(() => {
      console.log('Still running...');
    }, 60000); // Log every minute
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 