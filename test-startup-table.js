// Test script for Startup table
const { db, testConnection } = require('./dist/database');
const { v4: uuidv4 } = require('uuid');

async function testStartupTable() {
  try {
    console.log('Testing Startup table...');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }
    
    // First, check if we need to create the Startup table
    console.log('Checking if Startup table exists...');
    
    try {
      // Try to create the Startup table if it doesn't exist
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS Startup (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          details TEXT,
          stage VARCHAR(100),
          logo VARCHAR(255),
          banner VARCHAR(255),
          location VARCHAR(255),
          industry VARCHAR(255),
          ownerId VARCHAR(36) NOT NULL,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          INDEX idx_startup_owner (ownerId)
        )
      `;
      
      await db.query(createTableSQL);
      console.log('Startup table created or already exists');
    } catch (tableError) {
      console.error('Error creating Startup table:', tableError);
      return;
    }
    
    // Test creating a startup
    const startupId = uuidv4();
    const ownerId = '00000000-0000-0000-0000-000000000001'; // A dummy user ID
    const currentDate = new Date();
    
    // Create startup object
    const startupData = {
      id: startupId,
      name: 'Test Startup',
      details: 'This is a test startup',
      stage: 'SEED',
      location: 'Test Location',
      industry: 'Technology',
      ownerId: ownerId,
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    console.log('Creating test startup with data:', {
      id: startupData.id,
      name: startupData.name
    });
    
    // Create the startup
    await db.create('startups', startupData);
    
    // Retrieve the created startup to verify
    const createdStartup = await db.findOne('startups', { id: startupId });
    
    if (createdStartup) {
      console.log('Successfully created and retrieved startup:');
      console.log(createdStartup);
      
      // Clean up by deleting the test startup
      await db.delete('startups', startupId);
      console.log('Successfully deleted test startup');
    } else {
      console.error('Failed to retrieve created startup');
    }
    
    console.log('Startup table test completed successfully');
  } catch (error) {
    console.error('Error testing Startup table:', error);
  } finally {
    // Close the database connection
    await db.disconnect();
  }
}

// Run the test
testStartupTable(); 