const { PrismaClient } = require('@prisma/client');
const sqlite = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

const postgres = new PrismaClient();

async function migrate() {
  try {
    // Migrate Users
    const users = await sqlite.user.findMany();
    for (const user of users) {
      await postgres.user.create({
        data: {
          ...user,
          skills: {
            create: user.skills
          },
          education: {
            create: user.education
          },
          experience: {
            create: user.experience
          }
        }
      });
    }

    // Migrate Startups
    const startups = await sqlite.startup.findMany();
    for (const startup of startups) {
      await postgres.startup.create({
        data: {
          ...startup,
          roles: {
            create: startup.roles
          }
        }
      });
    }

    // Migrate other models similarly...

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

migrate(); 