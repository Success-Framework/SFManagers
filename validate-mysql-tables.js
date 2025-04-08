// Validate MySQL tables
const { db } = require('./src/database');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Expected tables based on our SQL export
const expectedTables = [
  'users',
  'startups',
  'roles',
  'user_roles',
  'task_statuses',
  'tasks',
  'task_assignees',
  'time_tracking_logs',
  'skills',
  'education',
  'experiences',
  'points_transactions',
  'leads',
  'lead_comments',
  'opportunities',
  'join_requests',
  'affiliate_links',
  'affiliate_clicks'
];

async function validateTables() {
  try {
    console.log('Validating MySQL database tables...');
    
    // Get a list of all tables in the database
    const showTablesResult = await db.raw('SHOW TABLES');
    
    // Extract table names from the result
    const existingTables = showTablesResult.map(row => {
      // The property name varies based on the database, get the first property
      const firstProperty = Object.keys(row)[0];
      return row[firstProperty];
    });
    
    console.log(`Found ${existingTables.length} tables in the database.`);
    
    // Check if all expected tables exist
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('Missing tables detected:');
      missingTables.forEach(table => console.error(`- ${table}`));
      console.error('\nPlease run the database-export.sql script to create these tables.');
    } else {
      console.log('All expected tables exist in the database.');
      
      // Verify that tables have records or are properly initialized
      console.log('\nVerifying table structures:');
      
      for (const table of expectedTables) {
        try {
          // Try to count records in each table
          const count = await db.count(table);
          console.log(`- ${table}: ${count} records`);
        } catch (error) {
          console.error(`- Error accessing table ${table}: ${error.message}`);
        }
      }
      
      console.log('\nDatabase validation complete!');
    }
  } catch (error) {
    console.error('Error validating MySQL tables:', error);
  } finally {
    // Close the database connection
    await db.disconnect();
  }
}

// Run validation
validateTables(); 