# Database Migration: Prisma to MySQL (PHPMyAdmin)

This guide will help you migrate your database from PostgreSQL (managed by Prisma) to MySQL (managed by PHPMyAdmin).

## Prerequisites

1. Make sure you have PHPMyAdmin installed and configured.
2. Install MySQL if not already installed.
3. Install the required Node.js packages by running:
   ```
   npm install
   ```

## Steps to Migrate

### 1. Configure Environment Variables

Update your `.env` file with MySQL connection details:

```
DB_HOST="localhost"  # or your MySQL server address
DB_USER="root"       # your MySQL username
DB_PASSWORD=""       # your MySQL password
DB_NAME="sfmanager_db"  # your MySQL database name
```

### 2. Create the MySQL Database and Tables

1. Create a new database in PHPMyAdmin or using MySQL CLI:
   
   ```sql
   CREATE DATABASE sfmanager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Run the database creation script to set up all tables:
   
   ```
   npm run db:create-tables
   ```
   
   Alternatively, you can import the `database-export.sql` file directly through PHPMyAdmin:
   
   - Open PHPMyAdmin
   - Select your database
   - Go to "Import" tab
   - Choose the `database-export.sql` file
   - Click "Go" to import

### 3. Migrate Data from PostgreSQL to MySQL

Run the migration script:

```
npm run db:migrate-to-mysql
```

This will transfer all your data from the PostgreSQL database to MySQL.

### 4. Verify the Migration

1. Check if all data has been migrated successfully through PHPMyAdmin.
2. Run the application with the new database:
   ```
   npm run dev
   ```
3. Test all functionality to ensure everything works with the new database.

## Troubleshooting

- If you encounter any errors during migration, check the `migration-log.txt` file for details.
- Ensure your MySQL server is running and accessible.
- If there are connection issues, verify the credentials in your `.env` file.
- For data type compatibility issues, you may need to modify the `database-export.sql` file.

## Reverting to Prisma (if necessary)

If you need to revert to Prisma/PostgreSQL, simply update your application to use the original Prisma client:

1. In your code, replace imports from `src/database.js` with `@prisma/client`.
2. Use the original `DATABASE_URL` in your `.env` file.

## Notes on PHPMyAdmin

Remember that PHPMyAdmin is just a web interface for managing MySQL databases. The actual database is MySQL, and PHPMyAdmin provides a GUI to interact with it. Your application will connect directly to MySQL, not to PHPMyAdmin. 