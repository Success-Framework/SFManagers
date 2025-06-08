// Script to check database structure
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'n7axTWEbzKnzEwIl',
  database: 'hdadmin_sfm'
};

async function checkDatabaseStructure() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Check User table structure
    console.log('\n--- User Table Structure ---');
    const [userColumns] = await connection.query('DESCRIBE User');
    console.log(userColumns);
    
    // Check Startup table structure
    console.log('\n--- Startup Table Structure ---');
    const [startupColumns] = await connection.query('DESCRIBE Startup');
    console.log(startupColumns);
    
    console.log('\nDatabase structure check completed successfully');
  } catch (error) {
    console.error('Error checking database structure:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function
checkDatabaseStructure();
