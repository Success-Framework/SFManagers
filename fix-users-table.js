// Script to check and fix the users table structure
const { db } = require('./src/database');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function fixUsersTable() {
  try {
    console.log('Checking users table structure...');
    
    // Just drop and recreate the users table
    console.log('Dropping and recreating users table...');
    
    try {
      // Drop the existing table if it exists
      await db.query(`
        DROP TABLE IF EXISTS users
      `);
      
      console.log('Dropped existing users table.');
    } catch (error) {
      console.error('Error dropping users table:', error);
    }
    
    // Create users table with correct structure
    await db.query(`
      CREATE TABLE users (
        id VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL,
        name VARCHAR(191) NOT NULL,
        password VARCHAR(191) NOT NULL,
        points INT NOT NULL DEFAULT 0,
        level INT NOT NULL DEFAULT 1,
        headline VARCHAR(191) NULL,
        bio TEXT NULL,
        location VARCHAR(191) NULL,
        profileImage VARCHAR(191) NULL,
        linkedinUrl VARCHAR(191) NULL,
        githubUrl VARCHAR(191) NULL,
        portfolio VARCHAR(191) NULL,
        phone VARCHAR(191) NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE INDEX email_unique (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('Users table recreated successfully.');
    
    // Create test users
    console.log('Creating test users...');
    
    // Admin user
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    
    const adminId = uuidv4();
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await db.query(`
      INSERT INTO users (id, email, name, password, points, level, headline, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [adminId, 'admin@example.com', 'Admin User', adminPassword, 100, 5, 'System Administrator']);
    
    console.log('Created admin user: admin@example.com (password: admin123)');
    
    // Regular user
    const userId = uuidv4();
    const userPassword = await bcrypt.hash('user123', 10);
    
    await db.query(`
      INSERT INTO users (id, email, name, password, points, level, headline, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [userId, 'user@example.com', 'Regular User', userPassword, 50, 2, 'Startup Enthusiast']);
    
    console.log('Created regular user: user@example.com (password: user123)');
    
    console.log('Users table setup completed successfully.');
  } catch (error) {
    console.error('Error fixing users table:', error);
  } finally {
    await db.disconnect();
  }
}

// Run the function
fixUsersTable(); 