// MySQL database connection adapter
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to sanitize values - convert undefined to null
const sanitizeValue = (value) => {
  return value === undefined ? null : value;
};

// Table name mapping for backward compatibility
const mapTableName = (model) => {
  // The database is using PascalCase table names directly
  const map = {
    'task': 'Task',
    'tasks': 'Task',
    'TASK': 'Task',
    'user': 'User',
    'users': 'User',
    'USER': 'User',
    'taskStatus': 'TaskStatus',
    'task_status': 'TaskStatus',
    'TASKSTATUS': 'TaskStatus',
    'taskAssignee': 'TaskAssignee',
    'task_assignees': 'TaskAssignee',
    'TASKASSIGNEE': 'TaskAssignee',
    'timeTrackingLog': 'TimeTrackingLog',
    'time_tracking_logs': 'TimeTrackingLog',
    'TIMETRACKINGLOGS': 'TimeTrackingLog',
    'startup': 'Startup',
    'startups': 'Startup',
    'STARTUP': 'Startup',
    'team': 'Team',
    'teams': 'Team',
    'TEAM': 'Team',
    'teamMember': 'TeamMember',
    'team_members': 'TeamMember',
    'TEAMMEMBER': 'TeamMember',
    'startupMember': 'startup_members',
    'StartupMember': 'startup_members',
    'startup_member': 'startup_members',
    'startup_members': 'startup_members',
    'STARTUPMEMBER': 'startup_members',
    'join_request': 'JoinRequest',
    'join_requests': 'JoinRequest',
    'joinRequest': 'JoinRequest',
    'joinRequests': 'JoinRequest',
    'JOINREQUEST': 'JoinRequest',
  };

  // If the model is already in PascalCase and not in the map, return it as is
  if (/^[A-Z][a-zA-Z0-9]*$/.test(model) && !map[model]) {
    return model;
  }
  
  // Otherwise, use the map or try to convert to PascalCase
  return map[model] || model.charAt(0).toUpperCase() + model.slice(1).replace(/s$/, '');
};

// Function to ensure backward compatibility with database fields
const mapFieldName = (field, table) => {
  // Map ORM field names to actual database column names if needed
  if (table === 'tasks') {
    // Add mappings for new freelance fields for backward compatibility
    const fieldMap = {
      'isFreelance': 'is_freelance',
      'freelancerId': 'freelancer_id'
    };
    
    return fieldMap[field] || field;
  }
  
  return field;
};

// Sanitize SQL query to handle errors better
const sanitizeQuery = (sql, params) => {
  try {
    // Log the query but protect sensitive information
    const maskedParams = params.map(param => 
      typeof param === 'string' && param.length > 20 
        ? param.substring(0, 8) + '...' + param.substring(param.length - 8) 
        : param
    );
    
    console.log(`SQL Query: ${sql}`);
    console.log(`With params: ${JSON.stringify(maskedParams)}`);
  
    return {
      sql,
      params: params.map(sanitizeValue)
    };
  } catch (err) {
    console.error('Error sanitizing query:', err);
    return { sql, params };
  }
};

// Test the database connection
async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database');
    
    // Test query to ensure we can interact with the database
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM User');
    console.log(`Database connection verified. Current user count: ${userRows[0].count}`);
    
    // Test another simple query
    const [startupRows] = await connection.query('SELECT COUNT(*) as count FROM Startup');
    console.log(`Additional verification - Startup count: ${startupRows[0].count}`);
    
    // Check for task_statuses table
    try {
      console.log('Checking if TaskStatus table exists...');
      
      // Check if TaskStatus table exists
      try {
        const [checkTaskStatus] = await connection.query('SELECT COUNT(*) as count FROM TaskStatus');
        console.log(`TaskStatus table exists with ${checkTaskStatus[0].count} records`);
      } catch (tableErr) {
        console.error('Error checking TaskStatus table:', tableErr.message);
      }
    } catch (viewError) {
      console.error('Error checking TaskStatus table:', viewError.message);
      // Continue execution even if checking fails
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Detailed database connection error:');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Error code:', error?.code);
    return false;
  }
}

// Function to create missing tables if they don't exist
async function ensureTablesExist() {
  try {
    console.log('Checking and creating missing tables if needed...');
    const connection = await pool.getConnection();
    
    // Check if User table exists
    try {
      await connection.query('SELECT 1 FROM User LIMIT 1');
      console.log('User table exists');
    } catch (error) {
      console.log('Creating User table...');
      await connection.query(`
        CREATE TABLE User (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('User table created successfully');
    }
    
    // Check if Startup table exists
    try {
      await connection.query('SELECT 1 FROM Startup LIMIT 1');
      console.log('Startup table exists');
    } catch (error) {
      console.log('Creating Startup table...');
      await connection.query(`
        CREATE TABLE Startup (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          logo_url VARCHAR(255),
          website VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          owner_id INT,
          FOREIGN KEY (owner_id) REFERENCES User(id) ON DELETE SET NULL
        )
      `);
      console.log('Startup table created successfully');
    }
    
    // Check if Task table exists
    try {
      await connection.query('SELECT 1 FROM Task LIMIT 1');
      console.log('Task table exists');
    } catch (error) {
      console.log('Creating Task table...');
      await connection.query(`
        CREATE TABLE Task (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status_id INT,
          startup_id INT,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          due_date DATE,
          FOREIGN KEY (created_by) REFERENCES User(id) ON DELETE SET NULL,
          FOREIGN KEY (startup_id) REFERENCES Startup(id) ON DELETE CASCADE
        )
      `);
      console.log('Task table created successfully');
    }
    
    // Check if tracker_sessions table exists
    try {
      await connection.query('SELECT 1 FROM tracker_sessions LIMIT 1');
      console.log('tracker_sessions table exists');
    } catch (error) {
      console.log('Creating tracker_sessions table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tracker_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          startup_id VARCHAR(191) NOT NULL,
          start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          end_time TIMESTAMP NULL DEFAULT NULL,
          is_active BOOLEAN DEFAULT TRUE
        )
      `);
      console.log('tracker_sessions table created successfully');
    }
    
    // Check if screenshots table exists
    try {
      await connection.query('SELECT 1 FROM screenshots LIMIT 1');
      console.log('screenshots table exists');
    } catch (error) {
      console.log('Creating screenshots table...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS screenshots (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          startup_id VARCHAR(191) NOT NULL,
          file_path TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('screenshots table created successfully');
      
      // Create indexes for tracker tables
      await connection.query('CREATE INDEX idx_screenshots_user_id ON screenshots(user_id)');
      await connection.query('CREATE INDEX idx_screenshots_startup_id ON screenshots(startup_id)');
      await connection.query('CREATE INDEX idx_screenshots_timestamp ON screenshots(timestamp)');
      await connection.query('CREATE INDEX idx_tracker_sessions_user_id ON tracker_sessions(user_id)');
      await connection.query('CREATE INDEX idx_tracker_sessions_startup_id ON tracker_sessions(startup_id)');
      await connection.query('CREATE INDEX idx_tracker_sessions_is_active ON tracker_sessions(is_active)');
      console.log('Tracker indexes created successfully');
    }
    
    connection.release();
    console.log('All required tables exist or have been created');
    return true;
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Helper functions to simplify database operations
const db = {
  // Added function to check/create tables
  ensureTables: ensureTablesExist,
  
  // Execute raw SQL query
  raw: async (sql, params = []) => {
    try {
      console.log('Executing raw SQL query:', sql);
      console.log('With parameters:', params);
      const sanitized = sanitizeQuery(sql, params);
      const [results] = await pool.execute(sanitized.sql, sanitized.params);
      console.log(`Query returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error('Raw query error:', error);
      console.error('Failed query:', sql);
      console.error('Parameters:', params);
      throw error;
    }
  },
  
  // Execute any query
  query: async (sql, params) => {
    try {
      const sanitized = sanitizeQuery(sql, params || []);
      const [results] = await pool.execute(sanitized.sql, sanitized.params);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      console.error('Query that failed:', sql);
      console.error('Params:', params);
      throw error;
    }
  },
  
  // Find a single record
  findOne: async (table, conditions) => {
    try {
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`findOne: mapping table '${table}' to '${mappedTable}'`);
      
      const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(conditions);
      
      const sql = `SELECT * FROM ${mappedTable} WHERE ${whereClause} LIMIT 1`;
      const sanitized = sanitizeQuery(sql, values);
      
      const [rows] = await pool.execute(sanitized.sql, sanitized.params);
      
      return rows[0] || null;
    } catch (error) {
      console.error(`Database findOne error for table ${table}:`, error);
      console.error('Conditions:', conditions);
      throw error;
    }
  },
  
  // Find multiple records
  findMany: async (table, conditions = {}, options = {}) => {
    try {
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`findMany: mapping table '${table}' to '${mappedTable}'`);
      
      let sql = `SELECT * FROM ${mappedTable}`;
      
      // Add WHERE clause if conditions exist
      const whereConditions = [];
      const values = [];
      
      if (Object.keys(conditions).length > 0) {
        Object.entries(conditions).forEach(([key, value]) => {
          whereConditions.push(`${key} = ?`);
          values.push(value);
        });
        
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      // Add ORDER BY if specified
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }
      
      // Add LIMIT if specified
      if (options.limit) {
        sql += ` LIMIT ?`;
        values.push(Number(options.limit));
      }
      
      // Add OFFSET if specified
      if (options.offset) {
        sql += ` OFFSET ?`;
        values.push(Number(options.offset));
      }
      
      const sanitized = sanitizeQuery(sql, values);
      const [rows] = await pool.execute(sanitized.sql, sanitized.params);
      return rows;
    } catch (error) {
      console.error(`Database findMany error for table ${table}:`, error);
      console.error('Conditions:', conditions);
      console.error('Options:', options);
      throw error;
    }
  },
  
  // Create a record
  create: async (table, data) => {
    try {
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`create: mapping table '${table}' to '${mappedTable}'`);
      
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const values = Object.values(data).map(sanitizeValue);
      
      const sql = `INSERT INTO ${mappedTable} (${keys.join(', ')}) VALUES (${placeholders})`;
      console.log('Executing SQL query:', sql, 'with values:', values);
      const [result] = await pool.execute(sql, values);
      
      if (result.insertId) {
        return { ...data, id: result.insertId };
      }
      
      return data;
    } catch (error) {
      console.error('Database create error:', error);
      throw error;
    }
  },
  
  // Update a record
  update: async (table, id, data) => {
    try {
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`update: mapping table '${table}' to '${mappedTable}'`);
      
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data).map(sanitizeValue), id];
      
      // Use only the mapped table name
      const sql = `UPDATE ${mappedTable} SET ${setClause} WHERE id = ?`;
      console.log('Executing SQL query:', sql, 'with values:', values);
      
      await pool.execute(sql, values);
      
      return { id, ...data };
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  },
  
  // Delete a record
  delete: async (table, id) => {
    try {
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`delete: mapping table '${table}' to '${mappedTable}'`);
      
      const sql = `DELETE FROM ${mappedTable} WHERE id = ?`;
      console.log('Executing SQL query:', sql, 'with values:', [id]);
      await pool.execute(sql, [id]);
      
      return { id };
    } catch (error) {
      console.error('Database delete error:', error);
      throw error;
    }
  },
  
  // Delete multiple records
  deleteMany: async (table, conditions = {}) => {
    try {
      if (Object.keys(conditions).length === 0) {
        throw new Error('Conditions are required for deleteMany operation');
      }
      
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`deleteMany: mapping table '${table}' to '${mappedTable}'`);
      
      const whereConditions = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
      const values = Object.values(conditions).map(sanitizeValue);
      
      const sql = `DELETE FROM ${mappedTable} WHERE ${whereConditions}`;
      console.log('Executing SQL query:', sql, 'with values:', values);
      const [result] = await pool.execute(sql, values);
      
      return { count: result.affectedRows };
    } catch (error) {
      console.error('Database deleteMany error:', error);
      throw error;
    }
  },
  
  // Count records in a table
  count: async (table, conditions = {}) => {
    try {
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`count: mapping table '${table}' to '${mappedTable}'`);
      
      let sql = `SELECT COUNT(*) as count FROM ${mappedTable}`;
      const values = [];
      
      // Add WHERE clause if conditions exist
      if (Object.keys(conditions).length > 0) {
        const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
        values.push(...Object.values(conditions).map(sanitizeValue));
        sql += ` WHERE ${whereClause}`;
      }
      
      console.log('Executing SQL query:', sql, 'with values:', values);
      const [result] = await pool.execute(sql, values);
      return result[0].count;
    } catch (error) {
      console.error('Database count error:', error);
      throw error;
    }
  },
  
  // Transaction support
  transaction: async (callback) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const result = await callback({
        query: async (sql, params) => {
          const sanitizedParams = params ? params.map(sanitizeValue) : [];
          const [results] = await connection.execute(sql, sanitizedParams);
          return results;
        },
        findOne: async (table, conditions) => {
          // Map table name for backward compatibility
          const mappedTable = mapTableName(table);
          console.log(`transaction findOne: mapping table '${table}' to '${mappedTable}'`);
          
          const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
          const values = Object.values(conditions).map(sanitizeValue);
          
          const sql = `SELECT * FROM ${mappedTable} WHERE ${whereClause} LIMIT 1`;
          const [rows] = await connection.execute(sql, values);
          
          return rows[0] || null;
        },
        create: async (table, data) => {
          // Map table name for backward compatibility
          const mappedTable = mapTableName(table);
          console.log(`transaction create: mapping table '${table}' to '${mappedTable}'`);
          
          const keys = Object.keys(data);
          const placeholders = keys.map(() => '?').join(', ');
          const values = Object.values(data).map(sanitizeValue);
          
          const sql = `INSERT INTO ${mappedTable} (${keys.join(', ')}) VALUES (${placeholders})`;
          const [result] = await connection.execute(sql, values);
          
          if (result.insertId) {
            return { ...data, id: result.insertId };
          }
          
          return data;
        },
        update: async (table, id, data) => {
          // Map table name for backward compatibility
          const mappedTable = mapTableName(table);
          console.log(`transaction update: mapping table '${table}' to '${mappedTable}'`);
          
          const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
          const values = [...Object.values(data).map(sanitizeValue), id];
          
          const sql = `UPDATE ${mappedTable} SET ${setClause} WHERE id = ?`;
          await connection.execute(sql, values);
          
          return { id, ...data };
        }
      });
      
      await connection.commit();
      connection.release();
      return result;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  },

  // Close all connections
  disconnect: async () => {
    return pool.end();
  }
};

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

// Export the database adapter
export { db, testConnection, ensureTablesExist }; 

