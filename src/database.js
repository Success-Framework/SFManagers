// MySQL database connection adapter
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

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
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Create startup_members table if it doesn't exist
    try {
      console.log('Creating startup_members table if it does not exist...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS startup_members (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          startupId VARCHAR(36) NOT NULL,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME,
          FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
          FOREIGN KEY (startupId) REFERENCES Startup(id) ON DELETE CASCADE,
          UNIQUE INDEX startup_member_unique (userId, startupId),
          INDEX startup_members_startup_idx (startupId),
          INDEX startup_members_user_idx (userId)
        )
      `);
      console.log('startup_members table created or already exists.');
    } catch (error) {
      console.error('Error creating startup_members table:', error);
    }

    // Check if JoinRequest table exists
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS JoinRequest (
          id VARCHAR(36) PRIMARY KEY,
          userId VARCHAR(36) NOT NULL,
          roleId VARCHAR(36) NOT NULL,
          startupId VARCHAR(36) NOT NULL,
          message TEXT,
          status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
          receiverId VARCHAR(36),
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          INDEX (userId),
          INDEX (roleId),
          INDEX (startupId),
          INDEX (status)
        )
      `);
      console.log('JoinRequest table created or already exists');
    } catch (joinRequestTableError) {
      console.error('Error creating JoinRequest table:', joinRequestTableError);
    }

    // Create AffiliateLink table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS AffiliateLink (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        userId VARCHAR(36) NOT NULL,
        startupId VARCHAR(36) NOT NULL,
        clicks INT DEFAULT 0,
        conversions INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (startupId),
        INDEX (userId),
        FOREIGN KEY (startupId) REFERENCES Startup(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      )
    `);
    console.log('AffiliateLink table created successfully');
    
    return true;
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return false;
  } finally {
    if (connection) {
      await connection.release();
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
      
      // First, check if the table exists and get its columns
      const checkQuery = `SHOW COLUMNS FROM ${mappedTable}`;
      const [columns] = await pool.query(checkQuery);
      const columnNames = columns.map(col => col.Field);
      console.log(`Table ${mappedTable} columns:`, columnNames);
      
      // Filter out any data fields that don't exist in the table
      const filteredData = {};
      for (const [key, value] of Object.entries(data)) {
        if (columnNames.includes(key)) {
          filteredData[key] = value;
        } else {
          console.warn(`Column '${key}' does not exist in table '${mappedTable}', skipping`);
        }
      }
      
      const keys = Object.keys(filteredData);
      const placeholders = keys.map(() => '?').join(', ');
      const values = Object.values(filteredData).map(sanitizeValue);
      
      const sql = `INSERT INTO ${mappedTable} (${keys.join(', ')}) VALUES (${placeholders})`;
      console.log('Executing SQL query:', sql, 'with values:', values);
      const [result] = await pool.execute(sql, values);
      
      if (result.insertId) {
        return { ...filteredData, id: result.insertId };
      }
      
      return filteredData;
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
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      console.log('Transaction started');
      
      const result = await callback({
        query: async (sql, params) => {
          try {
            console.log('Transaction - executing query:', sql);
            if (params) {
              console.log('With parameters:', params.map(p => 
                typeof p === 'string' && p.length > 20 ? p.substr(0, 10) + '...' : p));
            }
            const sanitizedParams = params ? params.map(sanitizeValue) : [];
            const [results] = await connection.execute(sql, sanitizedParams);
            return results;
          } catch (err) {
            console.error('Transaction query error:', err);
            console.error('Failed query:', sql);
            console.error('With parameters:', params);
            throw err;
          }
        },
        findOne: async (table, conditions) => {
          try {
            // Map table name for backward compatibility
            const mappedTable = mapTableName(table);
            console.log(`transaction findOne: mapping table '${table}' to '${mappedTable}'`);
            
            const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
            const values = Object.values(conditions).map(sanitizeValue);
            
            const sql = `SELECT * FROM ${mappedTable} WHERE ${whereClause} LIMIT 1`;
            const [rows] = await connection.execute(sql, values);
            
            return rows[0] || null;
          } catch (err) {
            console.error(`Transaction findOne error for table ${table}:`, err);
            throw err;
          }
        },
        create: async (table, data) => {
          try {
            // Map table name for backward compatibility
            const mappedTable = mapTableName(table);
            console.log(`transaction create: mapping table '${table}' to '${mappedTable}'`);
            
            // First, check if the table exists and get its columns
            const checkQuery = `SHOW COLUMNS FROM ${mappedTable}`;
            console.log('Checking table columns:', checkQuery);
            const [columns] = await connection.query(checkQuery);
            const columnNames = columns.map(col => col.Field);
            console.log(`Table ${mappedTable} has columns:`, columnNames.join(', '));
            
            // Filter out any data fields that don't exist in the table
            const filteredData = {};
            for (const [key, value] of Object.entries(data)) {
              if (columnNames.includes(key)) {
                filteredData[key] = value;
              } else {
                console.warn(`Column '${key}' does not exist in table '${mappedTable}', skipping`);
              }
            }

            // Log the filtered data that will be inserted
            console.log(`Filtered data for ${mappedTable}:`, filteredData);

            const keys = Object.keys(filteredData);
            if (keys.length === 0) {
              throw new Error(`No valid columns found for table '${mappedTable}'`);
            }
            
            const placeholders = keys.map(() => '?').join(', ');
            const values = Object.values(filteredData).map(sanitizeValue);
            
            const sql = `INSERT INTO ${mappedTable} (${keys.join(', ')}) VALUES (${placeholders})`;
            console.log('Transaction - executing create query:', sql);
            console.log('With values:', values);
            
            const [result] = await connection.execute(sql, values);
            
            if (result.insertId && !data.id) {
              return { ...filteredData, id: result.insertId };
            }
            
            return filteredData;
          } catch (err) {
            console.error(`Transaction create error for table ${table}:`, err);
            throw err;
          }
        },
        update: async (table, id, data) => {
          try {
            // Map table name for backward compatibility
            const mappedTable = mapTableName(table);
            console.log(`transaction update: mapping table '${table}' to '${mappedTable}'`);
            
            // Check table columns first
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${mappedTable}`);
            const columnNames = columns.map(col => col.Field);
            
            // Filter valid fields
            const filteredData = {};
            for (const [key, value] of Object.entries(data)) {
              if (columnNames.includes(key)) {
                filteredData[key] = value;
              } else {
                console.warn(`Column '${key}' does not exist in table '${mappedTable}', skipping`);
              }
            }
            
            const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(filteredData).map(sanitizeValue), id];
            
            const sql = `UPDATE ${mappedTable} SET ${setClause} WHERE id = ?`;
            console.log('Transaction - executing update query:', sql);
            console.log('With values:', values);
            
            await connection.execute(sql, values);
            
            return { id, ...filteredData };
          } catch (err) {
            console.error(`Transaction update error for table ${table}:`, err);
            throw err;
          }
        }
      });
      
      console.log('Transaction completed successfully, committing...');
      await connection.commit();
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      if (connection) {
        console.log('Rolling back transaction...');
        await connection.rollback();
      }
      throw error;
    } finally {
      if (connection) {
        console.log('Releasing connection...');
        connection.release();
      }
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
module.exports = { db, testConnection, ensureTablesExist }; 

