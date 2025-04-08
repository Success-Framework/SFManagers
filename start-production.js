/**
 * Production startup script for SFManager
 * This script builds the frontend and runs the application with both frontend and backend on the same port
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 Preparing SFManager for production deployment...\n');

// Stop any running Node processes
try {
  console.log('Stopping any running Node.js processes...');
  execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
  console.log('✅ Successfully stopped existing Node.js processes\n');
} catch (error) {
  console.log('ℹ️ No Node.js processes were running\n');
}

// Set environment variable
process.env.NODE_ENV = 'production';

// Build the application
console.log('Building the application for production...');
try {
  // Build the frontend
  console.log('Building frontend...');
  execSync('npx cross-env NODE_ENV=production webpack --mode production', { stdio: 'inherit' });
  
  // Build the backend
  console.log('\nBuilding backend...');
  execSync('npx tsc', { stdio: 'inherit' });
  
  console.log('\n✅ Build completed successfully\n');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

// Check if dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.error('❌ Build directory not found. Build process may have failed.');
  process.exit(1);
}

// Copy environment variables if .env file exists
if (fs.existsSync(path.join(__dirname, '.env'))) {
  try {
    fs.copyFileSync(
      path.join(__dirname, '.env'),
      path.join(__dirname, 'dist', '.env')
    );
    console.log('✅ Environment variables copied to dist directory\n');
  } catch (error) {
    console.warn('⚠️ Could not copy .env file:', error.message);
  }
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'dist', 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

console.log('✅ Upload directories created in dist\n');
console.log('🚀 Starting SFManager in production mode...\n');

// Start the application
try {
  // Use cross-env to set NODE_ENV for cross-platform compatibility
  execSync('npx cross-env NODE_ENV=production node dist/server.js', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
} catch (error) {
  console.error('❌ Application crashed:', error.message);
  process.exit(1);
} 