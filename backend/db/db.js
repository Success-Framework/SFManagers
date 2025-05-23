import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'n7axTWEbzKnzEwIl',
  database: 'hdadmin_sfm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to verify documents table structure
export const verifyDocumentsTable = async () => {
  try {
    const [rows] = await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        filePath VARCHAR(255) NOT NULL,
        fileType VARCHAR(100) NOT NULL,
        fileSize INT NOT NULL,
        startupId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (startupId) REFERENCES Startup(id),
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `);
    console.log('Documents table verified/created successfully');
  } catch (error) {
    console.error('Error verifying documents table:', error);
    throw error;
  }
};

export { pool }; 