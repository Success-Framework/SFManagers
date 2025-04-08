// Script to create initial test data in MySQL
const { db } = require('./src/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function createTestData() {
  try {
    console.log('Creating test data in MySQL database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await db.create('users', {
      id: uuidv4(),
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      points: 100,
      level: 5,
      headline: 'System Administrator',
      bio: 'I manage the platform and help startups connect.',
      location: 'San Francisco, CA',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Created admin user: ${adminUser.email} with ID: ${adminUser.id}`);

    // Create a regular user
    const regularUserPassword = await bcrypt.hash('user123', 10);
    const regularUser = await db.create('users', {
      id: uuidv4(),
      email: 'user@example.com',
      name: 'Regular User',
      password: regularUserPassword,
      points: 50,
      level: 2,
      headline: 'Startup Enthusiast',
      bio: 'Looking to join innovative startups.',
      location: 'New York, NY',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Created regular user: ${regularUser.email} with ID: ${regularUser.id}`);

    // Create a startup
    const startup = await db.create('startups', {
      id: uuidv4(),
      name: 'Test Startup',
      details: 'A startup created for testing purposes',
      stage: 'Seed',
      logo: null,
      banner: null,
      location: 'Boston, MA',
      industry: 'Technology',
      ownerId: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Created startup: ${startup.name} with ID: ${startup.id}`);

    // Create a role
    const role = await db.create('roles', {
      id: uuidv4(),
      title: 'Software Developer',
      roleType: 'Technical',
      isOpen: true,
      isPaid: false,
      startupId: startup.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Created role: ${role.title} with ID: ${role.id}`);

    // Assign the regular user to this role
    const userRole = await db.create('user_roles', {
      id: uuidv4(),
      userId: regularUser.id,
      roleId: role.id,
      startupId: startup.id,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Assigned user ${regularUser.name} to role ${role.title}`);

    // Create task statuses
    const statusIds = ['todo', 'inprogress', 'done'].map(async (statusName) => {
      const status = await db.create('task_statuses', {
        id: uuidv4(),
        name: statusName === 'todo' ? 'To Do' : (statusName === 'inprogress' ? 'In Progress' : 'Done'),
        startupId: startup.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Created task status: ${status.name} with ID: ${status.id}`);
      return status;
    });

    const resolvedStatuses = await Promise.all(statusIds);
    const todoStatus = resolvedStatuses[0];

    // Create a task
    const task = await db.create('tasks', {
      id: uuidv4(),
      title: 'Create initial website',
      description: 'Build a landing page for the startup',
      statusId: todoStatus.id,
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      startupId: startup.id,
      createdBy: adminUser.id,
      isTimerRunning: false,
      totalTimeSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Created task: ${task.title} with ID: ${task.id}`);

    // Assign task to the regular user
    const taskAssignee = await db.create('task_assignees', {
      id: uuidv4(),
      taskId: task.id,
      userId: regularUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Assigned task to user ${regularUser.name}`);

    console.log('Test data creation completed successfully!');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    // Close the database connection
    await db.disconnect();
  }
}

// Run the function
createTestData(); 