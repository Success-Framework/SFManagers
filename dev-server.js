const { exec } = require('child_process');
const path = require('path');

// Run the server using ts-node
console.log('Starting development server...');
const serverProcess = exec('npx ts-node src/server.ts');

// Forward stdout and stderr to the console
serverProcess.stdout.on('data', (data) => {
  console.log(data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.error(data.toString().trim());
});

// Handle server process exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Terminating server...');
  serverProcess.kill();
  process.exit();
}); 