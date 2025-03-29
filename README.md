
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
