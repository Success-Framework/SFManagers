const fs = require('fs');
const path = require('path');

// Define the screenshots directory path
const screenshotsDir = path.join(__dirname, 'uploads/screenshots');

console.log('Checking if screenshots directory exists:', screenshotsDir);
if (fs.existsSync(screenshotsDir)) {
  console.log('✅ Screenshots directory exists');
} else {
  console.log('❌ Screenshots directory does not exist');
  console.log('Attempting to create screenshots directory...');
  try {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('✅ Screenshots directory created successfully');
  } catch (error) {
    console.error('❌ Error creating screenshots directory:', error);
  }
}

// Test if we can write to the screenshots directory
const testFilePath = path.join(screenshotsDir, 'test-file.txt');
console.log('Testing if we can write to the screenshots directory...');
try {
  fs.writeFileSync(testFilePath, 'This is a test file to verify write permissions');
  console.log('✅ Successfully wrote test file to screenshots directory');
  
  // Read the file back to verify
  const content = fs.readFileSync(testFilePath, 'utf8');
  console.log('✅ Successfully read test file from screenshots directory');
  console.log('File content:', content);
  
  // Clean up the test file
  fs.unlinkSync(testFilePath);
  console.log('✅ Successfully deleted test file from screenshots directory');
} catch (error) {
  console.error('❌ Error writing to screenshots directory:', error);
}

// List all files in the screenshots directory
console.log('Listing all files in the screenshots directory:');
try {
  const files = fs.readdirSync(screenshotsDir);
  if (files.length === 0) {
    console.log('No files found in the screenshots directory');
  } else {
    files.forEach(file => {
      const filePath = path.join(screenshotsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`- ${file} (${stats.size} bytes, modified: ${stats.mtime})`);
    });
  }
} catch (error) {
  console.error('❌ Error listing files in screenshots directory:', error);
}
