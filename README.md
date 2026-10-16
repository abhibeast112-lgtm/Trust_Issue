# Trust Issues

A local web security lab built with Node.js, Express, and SQLite.

The goal is to study common web application security weaknesses,
demonstrate their impact in a controlled local environment, and
document appropriate mitigations.

## Tech Stack

- Node.js and JavaScript
- Express for HTTP routes
- SQLite with better-sqlite3 for persistent storage
- bcrypt for password hashing
- express-session for session management
- dotenv for environment configuration

## Current Features

- User registration
- Password hashing with bcrypt
- Login and password verification
- Session creation and logout
- An endpoint to check the current authenticated user
- SQLite tables for users, events, and registrations

## Requirements

- Node.js
- npm

## Setup

1. Install dependencies:

   npm install

2. Create a local environment file:

   cp .env.example .env

3. Generate a session secret:

   openssl rand -hex 32

4. Put the generated secret in `.env` as SESSION_SECRET.

5. Initialize the database:

   npm run db:init

6. Start the development server:

   npm run dev

The server listens on http://127.0.0.1:3000.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | / | Basic service information |
| GET | /health | Health check |
| POST | /api/auth/register | Register a member |
| POST | /api/auth/login | Log in |
| GET | /api/auth/me | Check the current session |
| POST | /api/auth/logout | Log out |

Registration and login expect JSON request bodies.

Example registration request:

    curl -i -X POST http://127.0.0.1:3000/api/auth/register \
      -H 'Content-Type: application/json' \
      -d '{"username":"testmember","password":"testpass123"}'

Example login request that saves the session cookie:

    curl -i -c cookies.txt \
      -X POST http://127.0.0.1:3000/api/auth/login \
      -H 'Content-Type: application/json' \
      -d '{"username":"testmember","password":"testpass123"}'

Check the session:

    curl -i -b cookies.txt http://127.0.0.1:3000/api/auth/me

Log out:

    curl -i -b cookies.txt \
      -X POST http://127.0.0.1:3000/api/auth/logout

## Security Notes

- Passwords are hashed rather than stored as plaintext.
- SQL statements use parameters for user-provided values.
- Registration assigns the member role on the server.
- The application is intended for local development and security testing.
- The default Express session store is not suitable for production.
- The local HTTP cookie configuration is not intended for production deployment.

## Limitations and Work in Progress

This is a learning project, not a production-ready service.
Event-management routes, comprehensive automated tests, and
documented vulnerability demonstrations and remediation tests
must be completed and verified before the project can be considered
a complete security assessment lab.

Do not deploy intentionally vulnerable test routes to a public server.
