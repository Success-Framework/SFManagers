
# SFManagers
Codebase for SFManagers
=======
# Startup Registration Application

A full-stack application for registering startups and their available roles. Built with TypeScript, Express, React, and Prisma.

## Features

- Register new startups with details and stage
- Add up to 5 roles for each startup
- Browse all registered startups
- Backend API with Express and Prisma
- Frontend built with React and TypeScript
- Responsive design with Bootstrap

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite via Prisma ORM
- **Frontend**: React, TypeScript, Bootstrap
- **Build Tools**: Webpack, ts-loader

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. The `.env` file contains database configuration and API key

## Database Setup

- Prisma schema is defined in `prisma/schema.prisma`
- Initialize database with:
  ```
  npm run db:push
  ```
- Generate Prisma client:
  ```
  npm run db:generate
  ```

## Using MySQL Database with PHPMyAdmin

The application has been updated to use MySQL database with PHPMyAdmin instead of Prisma/PostgreSQL. Here's how to use it:

### Setting Up the MySQL Database

1. Make sure you have MySQL server and PHPMyAdmin installed on your system.

2. Configure your MySQL connection in the `.env` file:
   ```
   DB_HOST="localhost"
   DB_USER="root"
   DB_PASSWORD=""
   DB_NAME="sfmanager_db"
   ```

3. Create the MySQL database:
   ```bash
   # Using MySQL command line
   mysql -u root -p -e "CREATE DATABASE sfmanager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # Or use PHPMyAdmin interface to create the database
   ```

4. Create database tables:
   ```bash
   npm run db:create-tables
   ```

### Migrating Data from PostgreSQL (if needed)

If you need to migrate data from an existing Prisma/PostgreSQL database:

```bash
npm run db:migrate-to-mysql
```

### Testing the MySQL Connection

To verify your MySQL connection is working:

```bash
npm run db:test-mysql
```

To validate database tables:

```bash
npm run db:validate-tables
```

### Running the Application with MySQL

Start the application using MySQL:

```bash
npm run start:mysql
```

### Troubleshooting

- If you encounter connection errors, check that your MySQL server is running and the credentials in `.env` are correct.
- For PHPMyAdmin access issues, ensure that PHPMyAdmin is properly configured to access your MySQL server.
- For detailed migration logs, check the `migration-log.txt` file generated during migration.

## Running the Application

### Development Mode

Run both frontend and backend in development mode:

```
npm run dev
```

This will start:
- Backend server on port 3000
- Frontend development server on port 8080 with hot reloading

To run separately:
- Backend only: `npm run server`
- Frontend only: `npm run client`

### Production Mode

Build the application:

```
npm run build
```

Start the production server:

```
npm start
```

## Project Structure

```
├── prisma/               # Prisma schema and migrations
├── src/
│   ├── client/           # React frontend
│   │   ├── components/   # React components
│   │   ├── index.tsx     # React entry point
│   │   └── types.ts      # TypeScript types
│   ├── controllers/      # Express controllers
│   ├── models/           # Data models
│   ├── public/           # Static assets
│   ├── routes/           # Express routes
│   ├── views/            # Server-side views
│   └── server.ts         # Express server
├── package.json
├── tsconfig.json         # TypeScript config for backend
└── tsconfig.client.json  # TypeScript config for React
```

## API Endpoints

- `GET /api/startups` - Retrieve all startups
- `POST /api/startups` - Create a new startup
