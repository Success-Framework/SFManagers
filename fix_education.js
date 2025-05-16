const fs = require('fs');
const path = require('path');

// Path to the compiled file
const filePath = path.join(__dirname, 'dist/routes/user.routes.js');

try {
  // Read the file
  console.log('Reading file:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Create a backup
  const backupPath = filePath + '.bak';
  console.log('Creating backup at:', backupPath);
  fs.writeFileSync(backupPath, content);
  
  // Look for the correct section to replace
  const educationCreateSection = content.indexOf('router.post(\'/profile/education\'');
  
  if (educationCreateSection === -1) {
    console.error('Could not find education route in file');
    process.exit(1);
  }
  
  // Find the beginning of the route handler
  const routeStart = content.indexOf('try {', educationCreateSection);
  if (routeStart === -1) {
    console.error('Could not find route handler start');
    process.exit(1);
  }
  
  // Find the education.create call
  const createCall = content.indexOf('prisma.education.create', routeStart);
  if (createCall === -1) {
    console.error('Could not find education.create call');
    process.exit(1);
  }
  
  // Find the beginning of the data object
  const dataStart = content.indexOf('data: {', createCall);
  if (dataStart === -1) {
    console.error('Could not find data object');
    process.exit(1);
  }
  
  // Find the end of the data object
  const dataEnd = findMatchingBrace(content, dataStart + 6);
  if (dataEnd === -1) {
    console.error('Could not find end of data object');
    process.exit(1);
  }
  
  // Extract the current data object
  const currentData = content.substring(dataStart + 6, dataEnd).trim();
  console.log('Current data object:', currentData);
  
  // Replace with fixed data object
  const fixedData = `
                school: school,
                degree: degree,
                field: fieldOfStudy, // Required field in database schema
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                description: description || '',
                userId: userId
            `;
  
  // Replace the data object
  content = content.substring(0, dataStart + 6) + fixedData + content.substring(dataEnd);
  
  // Save the changes
  console.log('Writing updated content back to file');
  fs.writeFileSync(filePath, content);
  
  console.log('Fixed education create function in', filePath);
  console.log('Restart the server with: pm2 restart all');
} catch (error) {
  console.error('Error updating file:', error);
  process.exit(1);
}

// Helper function to find matching closing brace
function findMatchingBrace(text, startIndex) {
  let level = 0;
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '{') {
      level++;
    } else if (text[i] === '}') {
      if (level === 0) {
        return i;
      }
      level--;
    }
  }
  return -1;
} 