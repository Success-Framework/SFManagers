// Test script to debug startup creation
const { db, testConnection } = require('./dist/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

async function testStartupCreation() {
  try {
    console.log('Testing startup creation...');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }

    // Get a valid user from the database to be the owner
    console.log('Finding a valid user to be the owner...');
    const users = await db.findMany('users', {}, { limit: 1 });
    if (!users || users.length === 0) {
      console.error('No users found in the database. Cannot create startup without an owner.');
      return;
    }
    
    const ownerId = users[0].id;
    console.log(`Using user ${ownerId} as startup owner`);
    
    // Create startup data
    const startupId = uuidv4();
    const currentDate = new Date();
    
    // Create startup object - matching the structure in startup.routes.js
    const startupData = {
      id: startupId,
      name: 'Test Debug Startup',
      details: 'This is a test startup for debugging',
      stage: 'SEED',
      location: 'Test Location',
      industry: 'Technology',
      ownerId: ownerId,
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    console.log('Creating test startup with data:', {
      id: startupData.id,
      name: startupData.name,
      ownerId: startupData.ownerId
    });
    
    // Try to find the actual route file that's encountering the error
    const routeFile = path.join(__dirname, 'dist', 'routes', 'startup.routes.js');
    console.log(`Checking if route file exists: ${routeFile}`);
    
    if (fs.existsSync(routeFile)) {
      console.log('Route file exists. Reading content...');
      const routeContent = fs.readFileSync(routeFile, 'utf8');
      
      // Find the line that's causing the error (around line 108)
      const lines = routeContent.split('\n');
      if (lines.length > 108) {
        console.log('Problematic line from startup.routes.js:');
        for (let i = Math.max(0, 108 - 5); i < Math.min(lines.length, 108 + 5); i++) {
          console.log(`${i}: ${lines[i]}`);
        }
      }
    } else {
      console.log('Route file not found');
    }
    
    // Try to create directly with db.query to bypass any potential issues
    console.log('\nTrying direct SQL query first...');
    try {
      const insertSQL = `
        INSERT INTO Startup (id, name, details, stage, location, industry, ownerId, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await db.query(insertSQL, [
        startupId,
        startupData.name,
        startupData.details,
        startupData.stage,
        startupData.location,
        startupData.industry,
        startupData.ownerId,
        startupData.createdAt,
        startupData.updatedAt
      ]);
      
      console.log('Direct SQL insert succeeded!');
    } catch (directError) {
      console.error('Direct SQL insert failed:', directError.message);
    }
    
    // Now try with the db.create method
    console.log('\nTrying db.create method...');
    try {
      const createdStartup = await db.create('startups', startupData);
      console.log('db.create succeeded!', createdStartup);
    } catch (createError) {
      console.error('db.create failed:', createError.message);
      console.error('Error code:', createError.code);
      console.error('SQL:', createError.sql);
      console.error('SQL State:', createError.sqlState);
      console.error('SQL Message:', createError.sqlMessage);
    }
    
    // Try to find the startup we created
    console.log('\nChecking if startup was created...');
    const foundStartups = await db.findMany('startups', { id: startupId });
    
    if (foundStartups && foundStartups.length > 0) {
      console.log('Startup was successfully created and found:', foundStartups[0]);
      
      // Clean up by deleting the test startup
      await db.delete('startups', startupId);
      console.log('Test startup deleted');
    } else {
      console.log('Could not find the created startup');
    }
    
  } catch (error) {
    console.error('Error testing startup creation:', error);
  } finally {
    // Close the database connection
    await db.disconnect();
  }
}

// Run the test
testStartupCreation(); 