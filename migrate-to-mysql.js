const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Prisma client for PostgreSQL
const prisma = new PrismaClient();

// MySQL connection
const mysqlConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function migrateData() {
  console.log('Starting migration from PostgreSQL to MySQL...');
  
  try {
    // Logging progress to file
    const logStream = fs.createWriteStream(path.join(__dirname, 'migration-log.txt'), { flags: 'a' });
    const log = (message) => {
      console.log(message);
      logStream.write(`${message}\n`);
    };

    log('Checking MySQL connection...');
    await mysqlConnection.query('SELECT 1');
    log('MySQL connection established successfully.');
    
    // Migrate Users
    log('Migrating users...');
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      try {
        // Transform the data to fit MySQL schema
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password,
          points: user.points,
          level: user.level,
          headline: user.headline,
          bio: user.bio,
          location: user.location,
          profileImage: user.profileImage,
          linkedinUrl: user.linkedinUrl,
          githubUrl: user.githubUrl,
          portfolio: user.portfolio,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
        
        // Insert into MySQL
        await mysqlConnection.query(
          'INSERT INTO users SET ?',
          userData
        );
        
        log(`Migrated user: ${user.email}`);
      } catch (error) {
        log(`Error migrating user ${user.email}: ${error.message}`);
      }
    }
    
    // Migrate Startups
    log('Migrating startups...');
    const startups = await prisma.startup.findMany();
    
    for (const startup of startups) {
      try {
        const startupData = {
          id: startup.id,
          name: startup.name,
          details: startup.details,
          stage: startup.stage,
          logo: startup.logo,
          banner: startup.banner,
          location: startup.location,
          industry: startup.industry,
          ownerId: startup.ownerId,
          createdAt: startup.createdAt,
          updatedAt: startup.updatedAt
        };
        
        await mysqlConnection.query(
          'INSERT INTO startups SET ?',
          startupData
        );
        
        log(`Migrated startup: ${startup.name}`);
      } catch (error) {
        log(`Error migrating startup ${startup.name}: ${error.message}`);
      }
    }
    
    // Migrate Roles
    log('Migrating roles...');
    const roles = await prisma.role.findMany();
    
    for (const role of roles) {
      try {
        const roleData = {
          id: role.id,
          title: role.title,
          roleType: role.roleType,
          isOpen: role.isOpen,
          isPaid: role.isPaid,
          startupId: role.startupId,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt
        };
        
        await mysqlConnection.query(
          'INSERT INTO roles SET ?',
          roleData
        );
        
        log(`Migrated role: ${role.title}`);
      } catch (error) {
        log(`Error migrating role ${role.title}: ${error.message}`);
      }
    }
    
    // Migrate User Roles
    log('Migrating user roles...');
    const userRoles = await prisma.userRole.findMany();
    
    for (const userRole of userRoles) {
      try {
        const userRoleData = {
          id: userRole.id,
          userId: userRole.userId,
          roleId: userRole.roleId,
          startupId: userRole.startupId,
          joinedAt: userRole.joinedAt,
          createdAt: userRole.createdAt,
          updatedAt: userRole.updatedAt
        };
        
        await mysqlConnection.query(
          'INSERT INTO user_roles SET ?',
          userRoleData
        );
        
        log(`Migrated user role: ${userRole.id}`);
      } catch (error) {
        log(`Error migrating user role ${userRole.id}: ${error.message}`);
      }
    }
    
    // Migrate Task Statuses
    log('Migrating task statuses...');
    const taskStatuses = await prisma.taskStatus.findMany();
    
    for (const status of taskStatuses) {
      try {
        const statusData = {
          id: status.id,
          name: status.name,
          startupId: status.startupId,
          createdAt: status.createdAt,
          updatedAt: status.updatedAt
        };
        
        await mysqlConnection.query(
          'INSERT INTO task_statuses SET ?',
          statusData
        );
        
        log(`Migrated task status: ${status.name}`);
      } catch (error) {
        log(`Error migrating task status ${status.name}: ${error.message}`);
      }
    }
    
    // Migrate Tasks
    log('Migrating tasks...');
    const tasks = await prisma.task.findMany();
    
    for (const task of tasks) {
      try {
        const taskData = {
          id: task.id,
          title: task.title,
          description: task.description,
          statusId: task.statusId,
          priority: task.priority,
          dueDate: task.dueDate,
          startupId: task.startupId,
          createdBy: task.createdBy,
          isTimerRunning: task.isTimerRunning,
          timerStartedAt: task.timerStartedAt,
          totalTimeSpent: task.totalTimeSpent,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        };
        
        await mysqlConnection.query(
          'INSERT INTO tasks SET ?',
          taskData
        );
        
        log(`Migrated task: ${task.title}`);
      } catch (error) {
        log(`Error migrating task ${task.title}: ${error.message}`);
      }
    }
    
    // Migrate Task Assignees
    log('Migrating task assignees...');
    const taskAssignees = await prisma.taskAssignee.findMany();
    
    for (const assignee of taskAssignees) {
      try {
        const assigneeData = {
          id: assignee.id,
          taskId: assignee.taskId,
          userId: assignee.userId,
          createdAt: assignee.createdAt,
          updatedAt: assignee.updatedAt
        };
        
        await mysqlConnection.query(
          'INSERT INTO task_assignees SET ?',
          assigneeData
        );
        
        log(`Migrated task assignee: ${assignee.id}`);
      } catch (error) {
        log(`Error migrating task assignee ${assignee.id}: ${error.message}`);
      }
    }
    
    // Continue with other tables...
    // Skills
    log('Migrating skills...');
    const skills = await prisma.skill.findMany();
    
    for (const skill of skills) {
      try {
        const skillData = {
          id: skill.id,
          name: skill.name,
          level: skill.level,
          userId: skill.userId,
          createdAt: skill.createdAt,
          updatedAt: skill.updatedAt
        };
        
        await mysqlConnection.query(
          'INSERT INTO skills SET ?',
          skillData
        );
        
        log(`Migrated skill: ${skill.name}`);
      } catch (error) {
        log(`Error migrating skill ${skill.name}: ${error.message}`);
      }
    }
    
    // ... migrate other tables similarly
    
    log('Migration completed successfully!');
    logStream.end();
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
    await mysqlConnection.end();
  }
}

// Run the migration
migrateData(); 