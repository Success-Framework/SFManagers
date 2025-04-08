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
const mapTableName = (table) => {
  const tableMapping = {
    'users': 'User',
    'startups': 'Startup',
    'roles': 'Role',
    'user_roles': 'UserRole',
    'tasks': 'Task',
    'task_assignees': 'TaskAssignee',
    'task_status': 'TaskStatus',
    'task_statuses': 'TaskStatus',
    'time_tracking_logs': 'TimeTrackingLog',
    'education': 'Education',
    'experience': 'Experience',
    'skills': 'Skill',
    'points_transactions': 'PointsTransaction',
    'leads': 'Lead',
    'lead_comments': 'LeadComment',
    'opportunities': 'Opportunity',
    'join_requests': 'JoinRequest',
    'affiliate_links': 'AffiliateLink',
    'affiliate_clicks': 'AffiliateClick',
    'notifications': 'Notification'
  };
  
  return tableMapping[table] || table;
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
    
    // Create a view for task_statuses if it doesn't exist
    try {
      console.log('Checking if task_statuses view/alias needs to be created...');
      
      // First check if TaskStatus table exists
      try {
        const [checkTaskStatus] = await connection.query('SELECT COUNT(*) as count FROM TaskStatus');
        console.log(`TaskStatus table exists with ${checkTaskStatus[0].count} records`);
      } catch (tableErr) {
        console.error('Error checking TaskStatus table:', tableErr.message);
      }
      
      // First drop the view if it exists to avoid errors
      await connection.query('DROP VIEW IF EXISTS task_statuses');
      console.log('Dropped existing task_statuses view if it existed');
      
      // Create the view that maps to TaskStatus
      await connection.query('CREATE VIEW task_statuses AS SELECT * FROM TaskStatus');
      console.log('Successfully created task_statuses view as alias for TaskStatus table');
      
      // Verify the view works
      try {
        const [viewCheck] = await connection.query('SELECT COUNT(*) as count FROM task_statuses');
        console.log(`Verified task_statuses view works with ${viewCheck[0].count} records`);
      } catch (viewCheckErr) {
        console.error('Error verifying task_statuses view:', viewCheckErr.message);
      }
    } catch (viewError) {
      console.error('Error creating task_statuses view:', viewError.message);
      // Continue execution even if view creation fails
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

// Helper functions to simplify database operations
const db = {
  // Execute any query
  query: async (sql, params) => {
    try {
      // Sanitize all parameters
      const sanitizedParams = params ? params.map(sanitizeValue) : [];
      const [results] = await pool.execute(sql, sanitizedParams);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
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
      const values = Object.values(conditions).map(sanitizeValue);
      
      const sql = `SELECT * FROM ${mappedTable} WHERE ${whereClause} LIMIT 1`;
      console.log('Executing SQL query:', sql, 'with values:', values);
      const [rows] = await pool.execute(sql, values);
      
      return rows[0] || null;
    } catch (error) {
      console.error('Database findOne error:', error);
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
          values.push(sanitizeValue(value));
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
      
      console.log('Executing SQL query:', sql, 'with values:', values);
      const [rows] = await pool.execute(sql, values);
      return rows;
    } catch (error) {
      console.error('Database findMany error:', error);
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
  
  // Count records
  count: async (table, conditions = {}) => {
    try {
      // Map table name for backward compatibility
      const mappedTable = mapTableName(table);
      console.log(`count: mapping table '${table}' to '${mappedTable}'`);
      
      let sql = `SELECT COUNT(*) as count FROM ${mappedTable}`;
      const values = [];
      
      // Add WHERE clause if conditions exist
      if (Object.keys(conditions).length > 0) {
        const whereConditions = Object.keys(conditions).map(key => {
          values.push(sanitizeValue(conditions[key]));
          return `${key} = ?`;
        });
        
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      console.log('Executing SQL query:', sql, 'with values:', values);
      const [rows] = await pool.execute(sql, values);
      return rows[0].count;
    } catch (error) {
      console.error('Database count error:', error);
      throw error;
    }
  },
  
  // Raw query execution
  raw: async (sql, params = []) => {
    try {
      // Special debugging for Task-related queries
      if (sql.includes('Task') && sql.includes('JOIN')) {
        console.log('Processing Task-related query:', sql);
      }
      
      // CRITICAL CHECK FOR TASKS WITH USER ROUTE QUERY
      if (sql.includes('JOIN TaskAssignee ta ON t.id = ta.taskId') && 
          sql.includes('JOIN TaskStatus ts ON t.statusId = ts.id') &&
          sql.includes('WHERE ta.userId = ?')) {
        console.log('DETECTED USER TASKS QUERY - BEFORE PROCESSING:', sql);
        
        // FOR THIS SPECIFIC QUERY, ENSURE WE PRESERVE THE TaskStatus TABLE NAME
        // This is a special case hack to prevent the problematic transformation
        if (sql.includes('TaskStatus ts ON t.statusId = ts.id')) {
          console.log('CRITICAL: Using the user tasks query untransformed to preserve TaskStatus table name');
          
          // Execute directly with the SQL as provided
          const [results] = await pool.execute(sql, params.map(sanitizeValue));
          return results;
        }
      }
      
      // Apply table name mappings to the SQL string
      let modifiedSql = sql;
      
      // Check specifically for the problematic query pattern from the error logs
      if (modifiedSql.includes('JOIN task_statuses ts ON t.statusId = ts.id')) {
        console.log('Found problematic task_statuses join in the query, fixing explicitly...');
        modifiedSql = modifiedSql.replace('JOIN task_statuses ts ON t.statusId = ts.id', 'JOIN TaskStatus ts ON t.statusId = ts.id');
      }
      
      // Extra check for any joins with task_statuses
      if (modifiedSql.includes('task_statuses')) {
        console.log('Query still contains task_statuses after initial fixes, applying broader replacement...');
        modifiedSql = modifiedSql.replace(/task_statuses/g, 'TaskStatus');
      }
      
      // Map table names in FROM clauses
      const tableMapping = {
        'users': 'User',
        'startups': 'Startup',
        'roles': 'Role',
        'user_roles': 'UserRole',
        'tasks': 'Task',
        'task_assignees': 'TaskAssignee',
        'task_status': 'TaskStatus',
        'task_statuses': 'TaskStatus',
        'time_tracking_logs': 'TimeTrackingLog',
        'education': 'Education',
        'experience': 'Experience',
        'skills': 'Skill',
        'points_transactions': 'PointsTransaction',
        'leads': 'Lead',
        'lead_comments': 'LeadComment',
        'opportunities': 'Opportunity',
        'join_requests': 'JoinRequest',
        'affiliate_links': 'AffiliateLink',
        'affiliate_clicks': 'AffiliateClick',
        'notifications': 'Notification'
      };
      
      // Replace table names in common SQL patterns
      Object.entries(tableMapping).forEach(([oldName, newName]) => {
        // Pattern matching for common SQL clauses with additional spacing variations
        // Handle FROM clause
        modifiedSql = modifiedSql.replace(new RegExp(`FROM\\s+${oldName}\\b`, 'gi'), `FROM ${newName}`);
        
        // Handle JOIN clause 
        modifiedSql = modifiedSql.replace(new RegExp(`JOIN\\s+${oldName}\\b`, 'gi'), `JOIN ${newName}`);
        
        // Handle different types of joins
        modifiedSql = modifiedSql.replace(new RegExp(`(LEFT|RIGHT|INNER|OUTER)\\s+JOIN\\s+${oldName}\\b`, 'gi'), 
                                         (match, joinType) => `${joinType} JOIN ${newName}`);
        
        // Handle INTO clause
        modifiedSql = modifiedSql.replace(new RegExp(`INTO\\s+${oldName}\\b`, 'gi'), `INTO ${newName}`);
        
        // Handle UPDATE clause
        modifiedSql = modifiedSql.replace(new RegExp(`UPDATE\\s+${oldName}\\b`, 'gi'), `UPDATE ${newName}`);
        
        // Handle DELETE FROM clause
        modifiedSql = modifiedSql.replace(new RegExp(`DELETE\\s+FROM\\s+${oldName}\\b`, 'gi'), `DELETE FROM ${newName}`);
        
        // Handle references in foreign keys
        modifiedSql = modifiedSql.replace(new RegExp(`REFERENCES\\s+${oldName}\\b`, 'gi'), `REFERENCES ${newName}`);
        
        // Handle multi-table operations
        modifiedSql = modifiedSql.replace(new RegExp(`\\s${oldName}\\s+AS\\s+`, 'gi'), ` ${newName} AS `);
        
        // Special case for task_statuses which seems to cause issues
        if (oldName === 'task_statuses' && newName === 'TaskStatus') {
          console.log('Special handling for task_statuses table');
          // Do an extra check for task_statuses with any spacing
          modifiedSql = modifiedSql.replace(new RegExp(`\\btask_statuses\\b`, 'gi'), `TaskStatus`);
          // Also explicitly check for task_statuses with 'ts' alias since this is a common pattern
          modifiedSql = modifiedSql.replace(/JOIN task_statuses ts/gi, 'JOIN TaskStatus ts');
          modifiedSql = modifiedSql.replace(/JOIN task_statuses as ts/gi, 'JOIN TaskStatus as ts');
        }
      });
      
      // Final check to ensure no instances of task_statuses remain
      if (modifiedSql.includes('task_statuses')) {
        console.log('WARNING: task_statuses still present in query after all replacements');
      }
      
      const sanitizedParams = params.map(sanitizeValue);
      
      // Log the before and after SQL for debugging
      if (modifiedSql !== sql) {
        console.log('Raw SQL query transformed:');
        console.log('Original:', sql);
        console.log('Modified:', modifiedSql);
      } else {
        console.log('No table mappings applied to query:', sql);
      }
      
      // CRITICAL CHECK FOR TASKS WITH USER ROUTE QUERY - AFTER TRANSFORMATION
      if (modifiedSql.includes('JOIN TaskAssignee ta ON t.id = ta.taskId') && 
          modifiedSql.includes('WHERE ta.userId = ?')) {
        console.log('FINAL USER TASKS QUERY - AFTER PROCESSING:', modifiedSql);
        if (modifiedSql.includes('task_statuses')) {
          console.log('WARNING: USER TASKS QUERY STILL CONTAINS task_statuses');
        } else {
          console.log('SUCCESS: USER TASKS QUERY PROPERLY USES TaskStatus');
        }
      }
      
      console.log('Executing raw SQL query with values:', sanitizedParams);
      const [results] = await pool.execute(modifiedSql, sanitizedParams);
      return results;
    } catch (error) {
      console.error('Database raw query error:', error);
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

// Export the database adapter
module.exports = { db, testConnection }; 