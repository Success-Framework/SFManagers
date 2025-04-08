// Script to check database structure and connections
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function checkDatabase() {
  console.log('Starting comprehensive database check...');
  console.log('Environment variables:');
  console.log('- DB_HOST:', process.env.DB_HOST);
  console.log('- DB_USER:', process.env.DB_USER);
  console.log('- DB_NAME:', process.env.DB_NAME);
  console.log('- MYSQL_DATABASE_URL:', process.env.MYSQL_DATABASE_URL);
  
  // Create a direct connection to the database
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('\nConnection established successfully.');
    
    // Check all tables in the database
    console.log('\nListing all tables in the database:');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables found:', tables.length);
    
    tables.forEach(tableRow => {
      const tableName = tableRow[`Tables_in_${process.env.DB_NAME}`];
      console.log(`- ${tableName}`);
    });
    
    // Check specifically for startups/Startup table
    console.log('\nChecking for Startup table...');
    const startupTableQueries = [
      'SHOW TABLES LIKE "Startup"',
      'SHOW TABLES LIKE "startup"',
      'SHOW TABLES LIKE "STARTUP"',
      'SHOW TABLES LIKE "startups"'
    ];
    
    for (const query of startupTableQueries) {
      const [results] = await connection.query(query);
      console.log(`Query "${query}" returned ${results.length} results`);
    }
    
    // Try to select from Startup table
    try {
      console.log('\nAttempting to select from Startup table...');
      const [startups] = await connection.query('SELECT * FROM Startup LIMIT 5');
      console.log(`Found ${startups.length} startups in Startup table:`);
      startups.forEach(startup => {
        console.log(`- ${startup.id}: ${startup.name}`);
      });
    } catch (err) {
      console.error('Error querying Startup table:', err.message);
    }
    
    // Check other important tables
    const tablesToCheck = ['User', 'Role', 'UserRole', 'Notification'];
    
    console.log('\nChecking other important tables:');
    for (const tableName of tablesToCheck) {
      try {
        const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`- ${tableName}: ${count[0].count} records`);
      } catch (err) {
        console.error(`- ${tableName}: ERROR - ${err.message}`);
      }
    }
    
    // Try to understand the actual schema structure
    console.log('\nGetting schema information:');
    try {
      const [schema] = await connection.query(`
        SELECT 
          TABLE_NAME, 
          COLUMN_NAME, 
          DATA_TYPE, 
          IS_NULLABLE, 
          COLUMN_KEY 
        FROM 
          INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_SCHEMA = ?
        ORDER BY 
          TABLE_NAME, 
          ORDINAL_POSITION
      `, [process.env.DB_NAME]);
      
      let currentTable = null;
      
      schema.forEach(column => {
        if (column.TABLE_NAME !== currentTable) {
          console.log(`\nTable: ${column.TABLE_NAME}`);
          currentTable = column.TABLE_NAME;
        }
        console.log(`  - ${column.COLUMN_NAME}: ${column.DATA_TYPE} ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${column.COLUMN_KEY ? `(${column.COLUMN_KEY})` : ''}`);
      });
    } catch (err) {
      console.error('Error getting schema information:', err.message);
    }
    
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    if (connection) {
      console.log('\nClosing database connection...');
      await connection.end();
    }
  }
}

// Run the check
checkDatabase(); 