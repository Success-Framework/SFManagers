// Test MySQL database connection
const { db, testConnection } = require('./src/database');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function runTests() {
  try {
    console.log('Testing MySQL database connection...');
    
    // Test connection
    const connectionSuccess = await testConnection();
    
    if (!connectionSuccess) {
      console.error('MySQL connection test failed!');
      process.exit(1);
    }
    
    console.log('MySQL connection test succeeded!');
    
    // Test basic database operations
    console.log('\nTesting basic database operations:');
    
    // Count users
    const userCount = await db.count('users');
    console.log(`- User count: ${userCount}`);
    
    // Count startups
    const startupCount = await db.count('startups');
    console.log(`- Startup count: ${startupCount}`);
    
    // Get first user if any exist
    if (userCount > 0) {
      const users = await db.findMany('users', {}, { limit: 1 });
      console.log(`- First user found: ${users[0].email}`);
    }
    
    // Get first startup if any exist
    if (startupCount > 0) {
      const startups = await db.findMany('startups', {}, { limit: 1 });
      console.log(`- First startup found: ${startups[0].name}`);
    }
    
    console.log('\nAll MySQL connection tests passed successfully!');
    console.log('Your application is now successfully using MySQL (PHPMyAdmin) instead of Prisma.');
    
  } catch (error) {
    console.error('Error during MySQL connection tests:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await db.disconnect();
  }
}

// Run tests
runTests(); 