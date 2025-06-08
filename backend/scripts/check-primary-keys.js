// Script to check primary keys in User and Startup tables
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'n7axTWEbzKnzEwIl',
  database: 'hdadmin_sfm'
};

async function checkPrimaryKeys() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');
    
    // Check User table primary key
    console.log('\n--- User Table Primary Key ---');
    const [userPK] = await connection.query(`
      SELECT k.COLUMN_NAME
      FROM information_schema.table_constraints t
      JOIN information_schema.key_column_usage k
      USING(constraint_name,table_schema,table_name)
      WHERE t.constraint_type='PRIMARY KEY'
        AND t.table_schema='hdadmin_sfm'
        AND t.table_name='User';
    `);
    console.log(userPK);
    
    // Check Startup table primary key
    console.log('\n--- Startup Table Primary Key ---');
    const [startupPK] = await connection.query(`
      SELECT k.COLUMN_NAME
      FROM information_schema.table_constraints t
      JOIN information_schema.key_column_usage k
      USING(constraint_name,table_schema,table_name)
      WHERE t.constraint_type='PRIMARY KEY'
        AND t.table_schema='hdadmin_sfm'
        AND t.table_name='Startup';
    `);
    console.log(startupPK);
    
    console.log('\nPrimary key check completed successfully');
  } catch (error) {
    console.error('Error checking primary keys:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function
checkPrimaryKeys();
