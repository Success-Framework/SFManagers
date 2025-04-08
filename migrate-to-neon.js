const { PrismaClient } = require('@prisma/client');

// Create two Prisma clients - one for SQLite and one for PostgreSQL
const sqlite = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

const postgres = new PrismaClient();

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // 1. Migrate Users
    console.log('Migrating Users...');
    const users = await sqlite.user.findMany({
      include: {
        skills: true,
        education: true,
        experience: true
      }
    });
    
    for (const user of users) {
      const { skills, education, experience, ...userData } = user;
      await postgres.user.create({
        data: {
          ...userData,
          skills: {
            create: skills
          },
          education: {
            create: education
          },
          experience: {
            create: experience
          }
        }
      });
    }

    // 2. Migrate Startups
    console.log('Migrating Startups...');
    const startups = await sqlite.startup.findMany({
      include: {
        roles: true
      }
    });

    for (const startup of startups) {
      const { roles, ...startupData } = startup;
      await postgres.startup.create({
        data: {
          ...startupData,
          roles: {
            create: roles
          }
        }
      });
    }

    // 3. Migrate Tasks and related data
    console.log('Migrating Tasks...');
    const tasks = await sqlite.task.findMany({
      include: {
        assignees: true,
        timeLogs: true
      }
    });

    for (const task of tasks) {
      const { assignees, timeLogs, ...taskData } = task;
      await postgres.task.create({
        data: {
          ...taskData,
          assignees: {
            create: assignees
          },
          timeLogs: {
            create: timeLogs
          }
        }
      });
    }

    // 4. Migrate Leads and Comments
    console.log('Migrating Leads...');
    const leads = await sqlite.lead.findMany({
      include: {
        comments: true
      }
    });

    for (const lead of leads) {
      const { comments, ...leadData } = lead;
      await postgres.lead.create({
        data: {
          ...leadData,
          comments: {
            create: comments
          }
        }
      });
    }

    // 5. Migrate Affiliate Links and Clicks
    console.log('Migrating Affiliate Links...');
    const affiliateLinks = await sqlite.affiliateLink.findMany({
      include: {
        clickEvents: true
      }
    });

    for (const link of affiliateLinks) {
      const { clickEvents, ...linkData } = link;
      await postgres.affiliateLink.create({
        data: {
          ...linkData,
          clickEvents: {
            create: clickEvents
          }
        }
      });
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

migrateData(); 