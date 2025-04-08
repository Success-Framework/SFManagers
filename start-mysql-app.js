// Start the application with MySQL database
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const { testConnection } = require('./src/database');

// Load environment variables
dotenv.config();

async function startApp() {
  try {
    console.log('Testing MySQL database connection before starting the app...');
    
    // Test connection
    const connectionSuccess = await testConnection();
    
    if (!connectionSuccess) {
      console.error('MySQL connection test failed! Cannot start the application.');
      process.exit(1);
    }
    
    console.log('MySQL connection test succeeded!');
    console.log('Your application is now using MySQL (PHPMyAdmin) instead of Prisma.');
    
    // Start the application with npm run dev
    console.log('\nStarting the application...');
    
    // Use spawn to run the npm command
    const npmProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle process events
    npmProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Application process exited with code ${code}`);
        process.exit(code);
      }
      console.log('Application stopped');
    });
    
    npmProcess.on('error', (err) => {
      console.error('Failed to start the application:', err);
      process.exit(1);
    });
    
    // Handle termination signals
    process.on('SIGINT', () => {
      console.log('Terminating application...');
      npmProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('Terminating application...');
      npmProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('Error starting the application:', error);
    process.exit(1);
  }
}

// Start the application
startApp(); 