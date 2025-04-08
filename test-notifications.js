// Test script for notifications table
const { db, testConnection } = require('./dist/database');
const { v4: uuidv4 } = require('uuid');

async function testNotifications() {
  try {
    console.log('Testing notifications table mapping...');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }
    
    // First, check if we need to create the notifications table
    console.log('Checking if Notification table exists...');
    
    try {
      // Try to create the Notification table if it doesn't exist
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS Notification (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          isRead BOOLEAN DEFAULT false,
          data TEXT,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          INDEX idx_notification_userId (userId)
        )
      `;
      
      await db.query(createTableSQL);
      console.log('Notification table created or already exists');
    } catch (tableError) {
      console.error('Error creating Notification table:', tableError);
      return;
    }
    
    // Create a test notification
    const notificationId = uuidv4();
    const userId = '00000000-0000-0000-0000-000000000001'; // A dummy user ID
    const currentDate = new Date();
    
    // Create notification object
    const notificationData = {
      id: notificationId,
      userId: userId,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'INFO',
      isRead: false,
      data: JSON.stringify({
        test: 'data'
      }),
      createdAt: currentDate,
      updatedAt: currentDate
    };
    
    console.log('Creating test notification with data:', {
      id: notificationData.id,
      title: notificationData.title
    });
    
    // Create the notification
    await db.create('notifications', notificationData);
    
    // Retrieve the created notification to verify
    const createdNotification = await db.findOne('notifications', { id: notificationId });
    
    if (createdNotification) {
      console.log('Successfully created and retrieved notification:');
      console.log(createdNotification);
      
      // Clean up by deleting the test notification
      await db.delete('notifications', notificationId);
      console.log('Successfully deleted test notification');
    } else {
      console.error('Failed to retrieve created notification');
    }
    
    console.log('Notification table mapping test completed successfully');
  } catch (error) {
    console.error('Error testing notifications:', error);
  } finally {
    // Close the database connection
    await db.disconnect();
  }
}

// Run the test
testNotifications(); 