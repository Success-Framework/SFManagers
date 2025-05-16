const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function runMigration() {
  console.log('Starting message system migration...');
  
  // Create MySQL connection with hardcoded credentials from Prisma schema
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'hdadmin_sfm',
    password: '25Y7Pwsd6UKEh4kTEsAC',
    database: 'hdadmin_sfm',
    multipleStatements: true
  });
  
  try {
    console.log('Connected to database. Running migration...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/create_messages_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await connection.query(sql);
    
    console.log('Message system migration completed successfully.');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error); 