const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Example of using the API key from environment variables
    const apiKey = process.env.API_KEY;
    console.log('API Key is configured');
    
    // Example database query
    const userCount = await prisma.user.count();
    console.log(`Number of users in the database: ${userCount}`);
    
    // You can add more database operations here
    
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return { success: false, message: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(result => console.log(result))
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 