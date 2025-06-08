import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTrackerTables() {
  try {
    console.log('Creating tracker tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../db/tracker_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      await db.query(statement);
    }
    
    console.log('Tracker tables created successfully');
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, '../../uploads/screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log('Screenshots directory created');
    }
    
  } catch (error) {
    console.error('Error creating tracker tables:', error);
  }
}

createTrackerTables();
