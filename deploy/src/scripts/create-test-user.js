const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        name: 'Test User',
        password: hashedPassword
      },
      create: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword
      }
    });
    
    console.log('Test user created/updated:', user);
    
    // Create a test startup
    const startup = await prisma.startup.upsert({
      where: { id: 'test-startup-id' },
      update: {
        name: 'Test Startup',
        details: 'Test startup details',
        ownerId: user.id
      },
      create: {
        id: 'test-startup-id',
        name: 'Test Startup',
        details: 'Test startup details',
        ownerId: user.id
      }
    });
    
    console.log('Test startup created/updated:', startup);
    
    // Create a test affiliate link
    const link = await prisma.affiliateLink.upsert({
      where: { code: 'testlink123' },
      update: {
        name: 'Test Link',
        userId: user.id,
        startupId: startup.id,
        clicks: 0,
        conversions: 0
      },
      create: {
        name: 'Test Link',
        code: 'testlink123',
        userId: user.id,
        startupId: startup.id,
        clicks: 0,
        conversions: 0
      }
    });
    
    console.log('Test affiliate link created/updated:', link);
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 