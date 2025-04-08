/**
 * Deployment script for the SFManager application
 * This script builds the application for production and prepares it for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Helper function to execute commands
function runCommand(command, description) {
  console.log(`${colors.cyan}${colors.bright}● ${description}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✓ Done!${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to ${description.toLowerCase()}${colors.reset}`);
    return false;
  }
}

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask a question and get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Main deployment function
async function deploy() {
  console.log(`\n${colors.bright}${colors.green}=======================================`);
  console.log(`SFManager Production Deployment Script`);
  console.log(`=======================================${colors.reset}\n`);
  
  // Check if cross-env is installed
  if (!runCommand('npx cross-env --version || npm install --save-dev cross-env', 'Checking for cross-env')) {
    console.log(`${colors.yellow}Installing cross-env for cross-platform environment variables...${colors.reset}`);
    if (!runCommand('npm install --save-dev cross-env', 'Installing cross-env')) {
      console.error(`${colors.red}Unable to install cross-env. Please install it manually with: npm install --save-dev cross-env${colors.reset}`);
      rl.close();
      return;
    }
  }
  
  // Clean previous build
  console.log(`${colors.cyan}${colors.bright}● Cleaning previous build...${colors.reset}`);
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    try {
      fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
      console.log(`${colors.green}✓ Previous build cleaned successfully!${colors.reset}\n`);
    } catch (error) {
      console.error(`${colors.red}✗ Failed to clean previous build: ${error.message}${colors.reset}\n`);
    }
  } else {
    console.log(`${colors.green}✓ No previous build to clean.${colors.reset}\n`);
  }
  
  // Verify database connection
  if (!runCommand('node test-mysql-connection.js', 'Verifying database connection')) {
    const setupDb = await askQuestion('Database connection failed. Do you want to proceed anyway? (y/n): ');
    if (setupDb.toLowerCase() !== 'y') {
      console.log(`${colors.yellow}Deployment cancelled.${colors.reset}`);
      rl.close();
      return;
    }
  }
  
  // Build for production
  if (!runCommand('npm run build:prod', 'Building for production')) {
    console.error(`${colors.red}Build failed. Please fix the errors and try again.${colors.reset}`);
    rl.close();
    return;
  }
  
  // Create .env file if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, '.env'))) {
    console.log(`${colors.yellow}No .env file found. Creating a basic one...${colors.reset}`);
    
    const port = await askQuestion('Enter the port number for the server (default: 3000): ');
    const jwtSecret = await askQuestion('Enter JWT secret (or press enter for a random one): ');
    const dbHost = await askQuestion('Enter database host (default: localhost): ');
    const dbUser = await askQuestion('Enter database user: ');
    const dbPassword = await askQuestion('Enter database password: ');
    const dbName = await askQuestion('Enter database name: ');
    
    // Generate content for .env file
    const envContent = `PORT=${port || 3000}
NODE_ENV=production
JWT_SECRET=${jwtSecret || require('crypto').randomBytes(32).toString('hex')}
DB_HOST=${dbHost || 'localhost'}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
`;
    
    // Write the .env file
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log(`${colors.green}✓ Created .env file!${colors.reset}\n`);
  }
  
  // Create a .env in dist directory for deployment
  fs.copyFileSync(path.join(__dirname, '.env'), path.join(__dirname, 'dist', '.env'));
  console.log(`${colors.green}✓ Copied .env file to dist directory!${colors.reset}\n`);
  
  // Copy package.json and create a simplified version for deployment
  const packageJson = require('./package.json');
  const deployPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    main: 'server.js',
    scripts: {
      start: 'cross-env NODE_ENV=production node server.js'
    },
    dependencies: packageJson.dependencies
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'dist', 'package.json'), 
    JSON.stringify(deployPackageJson, null, 2)
  );
  console.log(`${colors.green}✓ Created simplified package.json for deployment!${colors.reset}\n`);
  
  // Create uploads directory in dist
  if (!fs.existsSync(path.join(__dirname, 'dist', 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'dist', 'uploads'), { recursive: true });
  }
  if (!fs.existsSync(path.join(__dirname, 'dist', 'uploads', 'profiles'))) {
    fs.mkdirSync(path.join(__dirname, 'dist', 'uploads', 'profiles'), { recursive: true });
  }
  console.log(`${colors.green}✓ Created uploads directories in dist!${colors.reset}\n`);
  
  // Copy existing uploads if they exist
  if (fs.existsSync(path.join(__dirname, 'uploads'))) {
    console.log(`${colors.cyan}${colors.bright}● Copying existing uploads...${colors.reset}`);
    try {
      const files = fs.readdirSync(path.join(__dirname, 'uploads'));
      for (const file of files) {
        const sourcePath = path.join(__dirname, 'uploads', file);
        const destPath = path.join(__dirname, 'dist', 'uploads', file);
        
        if (fs.lstatSync(sourcePath).isFile()) {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
      console.log(`${colors.green}✓ Copied existing uploads!${colors.reset}\n`);
    } catch (error) {
      console.error(`${colors.red}✗ Error copying uploads: ${error.message}${colors.reset}\n`);
    }
  }
  
  console.log(`${colors.bright}${colors.green}=======================================`);
  console.log(`Deployment package created successfully!`);
  console.log(`=======================================${colors.reset}\n`);
  
  console.log(`${colors.cyan}Your application is built and ready for deployment.${colors.reset}`);
  console.log(`${colors.cyan}The deployment package is in the ${colors.bright}./dist${colors.reset}${colors.cyan} directory.${colors.reset}`);
  console.log(`${colors.cyan}You can run it with:${colors.reset} cd dist && npm start\n`);
  
  const startNow = await askQuestion('Do you want to start the application now? (y/n): ');
  if (startNow.toLowerCase() === 'y') {
    console.log(`\n${colors.green}Starting the application...${colors.reset}\n`);
    process.chdir(path.join(__dirname, 'dist'));
    runCommand('node server.js', 'Running the application');
  } else {
    console.log(`\n${colors.yellow}Deployment completed. You can start the application later.${colors.reset}\n`);
  }
  
  rl.close();
}

// Run the deployment script
deploy().catch(error => {
  console.error(`${colors.red}Deployment failed: ${error.message}${colors.reset}`);
  rl.close();
}); 