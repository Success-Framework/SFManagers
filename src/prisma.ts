// Import the MySQL db adapter instead of Prisma
import { db } from './database';

// Export the db adapter as default to maintain compatibility with existing imports
export default db; 