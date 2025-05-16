// Database migration script for Idea and IdeaVote tables

const { db } = require('../database');
// Fix logging to use console directly
const logger = console;

// Helper function to check if a table exists
async function tableExists(tableName) {
  try {
    // Use a simple query to check if the table exists
    const result = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?
    `, [tableName]);
    
    const exists = result && result[0] && result[0].count > 0;
    logger.log(`Table ${tableName} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error.message);
    return false;
  }
}

async function createIdeaTable() {
  try {
    // Check if table already exists
    const exists = await tableExists('Idea');
    
    if (exists) {
      logger.log('Idea table already exists');
      return true;
    }
    
    logger.log('Creating Idea table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS Idea (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        tags JSON,
        createdBy VARCHAR(36) NOT NULL,
        startupId VARCHAR(36) NOT NULL,
        isApproved TINYINT(1) DEFAULT 0,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (startupId),
        INDEX (createdBy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;
    
    await db.raw(createTableSQL);
    logger.log('Idea table created successfully');
    return true;
  } catch (error) {
    logger.error('Error creating Idea table:', error);
    // Don't throw the error to prevent server crash
    console.error('Error creating Idea table, but continuing server startup:', error.message);
    return false;
  }
}

async function createIdeaVoteTable() {
  try {
    // Check if table already exists
    const exists = await tableExists('IdeaVote');
    
    if (exists) {
      logger.log('IdeaVote table already exists');
      return true;
    }
    
    logger.log('Creating IdeaVote table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS IdeaVote (
        id VARCHAR(36) PRIMARY KEY,
        ideaId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        value INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (ideaId),
        INDEX (userId),
        UNIQUE INDEX (ideaId, userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;
    
    await db.raw(createTableSQL);
    logger.log('IdeaVote table created successfully');
    return true;
  } catch (error) {
    logger.error('Error creating IdeaVote table:', error);
    // Don't throw the error to prevent server crash
    console.error('Error creating IdeaVote table, but continuing server startup:', error.message);
    return false;
  }
}

async function createIdeaCommentTable() {
  try {
    // Check if table already exists
    const exists = await tableExists('IdeaComment');
    
    if (exists) {
      logger.log('IdeaComment table already exists');
      return true;
    }
    
    logger.log('Creating IdeaComment table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS IdeaComment (
        id VARCHAR(36) PRIMARY KEY,
        ideaId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        parentId VARCHAR(36) DEFAULT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (ideaId),
        INDEX (userId),
        INDEX (parentId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;
    
    await db.raw(createTableSQL);
    logger.log('IdeaComment table created successfully');
    return true;
  } catch (error) {
    logger.error('Error creating IdeaComment table:', error);
    // Don't throw the error to prevent server crash
    console.error('Error creating IdeaComment table, but continuing server startup:', error.message);
    return false;
  }
}

async function migrateIdeaTables() {
  try {
    console.log('Starting idea tables migration...');
    const ideaTableCreated = await createIdeaTable();
    const voteTableCreated = await createIdeaVoteTable();
    const commentTableCreated = await createIdeaCommentTable();
    
    if (ideaTableCreated && voteTableCreated && commentTableCreated) {
      console.log('All idea-related tables migrated successfully');
      return true;
    } else {
      console.warn('Some idea tables could not be created. Check the logs for details.');
      return false;
    }
  } catch (error) {
    logger.error('Error migrating idea-related tables:', error);
    console.error('Error in idea tables migration, but continuing server startup:', error.message);
    return false;
  }
}

// Export the functions
module.exports = {
  migrateIdeaTables,
  createIdeaTable,
  createIdeaVoteTable,
  createIdeaCommentTable
}; 