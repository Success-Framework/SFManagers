/**
 * This script safely adds the 'website' column to the 'startups' table
 * It first checks if the column exists, and only adds it if it doesn't
 */

// Get database connection from the main app
const { db } = require('./dist/database');

async function safeAddWebsiteColumn() {
  try {
    console.log('Checking if website column exists in startups table...');
    
    // First try to query the column to see if it exists
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = DATABASE() AND 
        TABLE_NAME = 'startups' AND 
        COLUMN_NAME = 'website'
    `;
    
    const columnExists = await db.query(checkColumnQuery);
    
    if (columnExists && columnExists.length > 0) {
      console.log('Website column already exists in startups table');
      return true;
    }
    
    // If we get here, the column doesn't exist, so add it
    console.log('Website column does not exist. Adding it now...');
    
    const addColumnQuery = `
      ALTER TABLE startups 
      ADD COLUMN website VARCHAR(255)
    `;
    
    await db.query(addColumnQuery);
    console.log('Successfully added website column to startups table');
    return true;
  } catch (error) {
    console.error('Error managing website column:', error);
    return false;
  }
}

// Run the function and exit
safeAddWebsiteColumn()
  .then(success => {
    console.log('Script completed ' + (success ? 'successfully' : 'with errors'));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 