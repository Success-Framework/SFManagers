// Test script for user registration
const { db } = require('./src/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function testUserRegistration() {
  try {
    console.log('Testing user registration...');
    
    // Check if users table exists and examine structure
    try {
      const [results] = await db.query('SHOW COLUMNS FROM users');
      console.log('Users table columns:');
      if (Array.isArray(results)) {
        results.forEach(col => {
          console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})${col.Key ? ' [' + col.Key + ']' : ''}`);
        });
      } else {
        console.log('No columns found or unexpected format:', results);
      }
    } catch (err) {
      console.error('Error fetching table structure:', err);
    }
    
    // Create a test user
    const testUserId = uuidv4();
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = await bcrypt.hash('Test123!', 10);
    const currentDate = new Date();
    
    // Create user object with all required fields
    const userData = {
      id: testUserId,
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      points: 0,
      level: 1,
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    console.log('Creating test user with data:', {
      id: userData.id,
      email: userData.email,
      name: userData.name
    });
    
    // Create the user
    await db.create('users', userData);
    
    // Retrieve the created user to verify
    const createdUser = await db.findOne('users', { id: testUserId });
    
    if (createdUser) {
      console.log('✅ User created successfully!');
      console.log('User data:', {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        hasPassword: !!createdUser.password
      });
      
      // Clean up - delete the test user
      try {
        // Pass the ID directly instead of an object
        await db.delete('users', testUserId);
        console.log('Test user deleted.');
      } catch (deleteError) {
        console.error('Failed to delete test user:', deleteError);
        // Try an alternative approach - raw SQL query
        await db.query('DELETE FROM users WHERE id = ?', [testUserId]);
        console.log('Test user deleted using raw SQL query.');
      }
    } else {
      console.error('❌ Failed to create user - user not found after creation.');
    }
  } catch (error) {
    console.error('Error testing user registration:', error);
  } finally {
    await db.disconnect();
  }
}

// Run the test
testUserRegistration(); 