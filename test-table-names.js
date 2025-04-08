const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkTableNames() {
  let connection;
  
  try {
    // Create a direct MySQL connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Connected to database successfully');
    
    // Query to get all table names in the database
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in the database:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });
    
    // Try to query the User table specifically
    try {
      const [userCount] = await connection.query('SELECT COUNT(*) as count FROM User');
      console.log(`User table exists! Count: ${userCount[0].count}`);
    } catch (err) {
      console.error('Error querying User table:', err.message);
    }
    
    // Try lowercase users as well
    try {
      const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
      console.log(`users table exists! Count: ${userCount[0].count}`);
    } catch (err) {
      console.error('Error querying users table:', err.message);
    }
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

checkTableNames()
  .then(() => console.log('Table check complete'))
  .catch(err => console.error('Script error:', err)); 