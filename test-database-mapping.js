// Test script for database table name mapping
const { db, testConnection } = require('./dist/database');

async function testDatabaseMapping() {
  try {
    console.log('Testing database table name mapping...');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to the database. Exiting...');
      process.exit(1);
    }
    
    // Test querying different table names to see how mapping works
    const tables = [
      'users',
      'User',
      'startups',
      'Startup',
      'roles',
      'Role',
      'notifications',
      'Notification'
    ];
    
    console.log('\nTesting table name mappings with db.findMany():');
    for (const table of tables) {
      try {
        console.log(`\nAttempting to query table: '${table}'`);
        const results = await db.findMany(table, {}, { limit: 1 });
        console.log(`Success! Found ${results.length} records in ${table}`);
      } catch (error) {
        console.error(`Error querying ${table}:`, error.message);
        if (error.sql) {
          console.error('SQL:', error.sql);
        }
      }
    }
    
    // Test how the mapTableName function works directly
    console.log('\nExamining the internal mapTableName function directly:');
    // This is a hack to access the internal function
    const dbModule = require('./dist/database');
    const mapTableName = Object.values(dbModule).find(v => typeof v === 'object' && v.query)._mapTableName || null;
    
    if (mapTableName && typeof mapTableName === 'function') {
      for (const table of tables) {
        try {
          const mappedName = mapTableName(table);
          console.log(`'${table}' maps to '${mappedName}'`);
        } catch (err) {
          console.error(`Error mapping table name '${table}':`, err.message);
        }
      }
    } else {
      console.error('Could not access mapTableName function directly');
    }
    
    console.log('\nDatabase table name mapping test completed');
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Close the database connection
    await db.disconnect();
  }
}

// Run the test
testDatabaseMapping(); 