const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting data migration...');

    // 1. Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedpassword123',
        skills: {
          create: [
            { name: 'JavaScript', level: 5 },
            { name: 'React', level: 4 }
          ]
        }
      }
    });

    console.log('Created test user:', user);

    // 2. Create a test startup
    const startup = await prisma.startup.create({
      data: {
        name: 'Test Startup',
        details: 'A test startup',
        ownerId: user.id,
        stage: 'Idea',
        industry: 'Technology'
      }
    });

    console.log('Created test startup:', startup);

    // 3. Create a test role
    const role = await prisma.role.create({
      data: {
        title: 'Developer',
        roleType: 'TECHNICAL',
        startupId: startup.id,
        isOpen: true,
        isPaid: true
      }
    });

    console.log('Created test role:', role);

    // 4. Create a test task
    const taskStatus = await prisma.taskStatus.create({
      data: {
        name: 'In Progress',
        startupId: startup.id
      }
    });

    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        description: 'A test task',
        priority: 'HIGH',
        statusId: taskStatus.id,
        startupId: startup.id,
        createdBy: user.id
      }
    });

    console.log('Created test task:', task);

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 