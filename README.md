# Trust Issues

**An intentionally vulnerable web application for learning, demonstrating, and testing common web security vulnerabilities.**

Trust Issues is a local security lab built with **Node.js, Express, and SQLite**. It models a simple college club portal with member accounts, event registrations, and administrative functionality.

The project demonstrates an important security principle: **authentication alone does not guarantee authorization**. An application must also verify what an authenticated user is allowed to access and do.

The lab includes intentionally vulnerable endpoints, secured counterparts, proof-of-concept requests, remediation notes, and automated security regression tests.

> **Security notice:** This project intentionally contains vulnerable endpoints. Run it only in a controlled local environment. Never expose the vulnerable lab routes to the public internet or use them against systems you do not own or have explicit permission to test.

## Objectives

The project explores how common web application security weaknesses arise, how they can be exploited in a controlled environment, and how appropriate security controls prevent them.

The main objectives are to:

- Implement authentication and role-aware application functionality.
- Demonstrate at least three distinct vulnerability classes.
- Compare vulnerable implementations with secured alternatives.
- Explain the root cause and potential impact of each vulnerability.
- Verify mitigations through repeatable tests.
- Document security assumptions, testing methodology, and limitations.

## Technology Stack

Node.js --> Javascript runtime
Express --> HTTP server and API routing
SQLite  --> Persistent relational database
better-sqlite3 --> SQlite database access
bcrypt  --> Password hashing and verification
express-session --> Server-side session management
dotenv  --> Environmental configuration
Node.js Test Runner --> Automated regression testing
curl    --> Manual API and proof-of-concept testing


## Security Demonstrations

The application contains three vulnerability demonstrations. Each compares an intentionally vulnerable implementation with a secured counterpart.

### 1. Insecure Direct Object Reference (IDOR)

**Category:** Broken access control

The vulnerable registration endpoint checks whether a user is logged in but fails to verify that the requested registration data belongs to that user.

An authenticated member can request another user's registrations by changing the user ID in the URL.

**Vulnerable endpoint**

`GET /api/registrations/lab/vulnerable/users/:userId`

**Secured endpoint**

`GET /api/registrations/secure/users/:userId`

**Mitigation:** The secured endpoint compares the requested user ID with the authenticated user's ID and rejects unauthorized cross-user requests.

**Expected verification:** The vulnerable endpoint can return another user's registration data, while the secured endpoint returns `403 Forbidden` for an unauthorized ownership request.

### 2. Broken Role-Based Authorization

**Category:** Broken access control

The vulnerable event-creation endpoint requires authentication but does not enforce the administrator role. Consequently, an ordinary member can perform an action intended to be restricted.

**Vulnerable endpoint**

`POST /api/events/lab/vulnerable`

**Secured endpoint**

`POST /api/events/secure`

**Mitigation:** The secured endpoint checks the authenticated session's role on the server and permits event creation only for administrators.

**Expected verification:** A member can create an event through the vulnerable endpoint, but the secured endpoint returns `403 Forbidden`.

### 3. SQL Injection

**Category:** Injection

The vulnerable search endpoint directly interpolates user-controlled input into an SQL statement. Specially crafted input can change the query's logic and return unintended records.

**Vulnerable endpoint**

`GET /api/search/lab/vulnerable?username=...`

**Secured endpoint**

`GET /api/search/secure?username=...`

**Mitigation:** The secured endpoint uses a parameterized SQL statement, treating user input as a value rather than executable SQL syntax.

**Expected verification:** The demonstrated injection returns multiple users through the vulnerable endpoint. The secured endpoint returns no matches for the same payload.

## Prerequisites

Install the following before starting:

- Node.js 22 or a compatible version supported by the project dependencies.
- npm.
- Git, for cloning the repository.

Check your installed versions:

```bash
node --version
npm --version
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/abhibeast112-lgtm/Trust_Issue.git
cd Trust_Issue
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

Create your local environment file:

```bash
cp .env.example .env
```

Generate a random session secret:

```bash
openssl rand -hex 32
```

Place the generated value in `.env`:

```dotenv
PORT=3000
SESSION_SECRET=replace-with-your-generated-secret
```

Do not commit `.env` or share your session secret.

### 4. Initialize the database

```bash
npm run db:init
```

The application creates the SQLite database and its tables if they do not already exist.

### 5. Run the application

Development mode:

```bash
npm run dev
```

Alternatively:

```bash
npm start
```

The server listens on:

`http://127.0.0.1:3000`

### 6. Verify that the application is running

```bash
curl -i http://127.0.0.1:3000/health
```

Expected response:

```json
{
  "status": "healthy"
}
```

## API Reference

### General endpoints

| Method | Endpoint | Description         |
|        |          |                     |
| GET    | `/`      | Service information |
| GET    | `/health`| Health check        |

### Authentication endpoints

| Method | Endpoint             | Description                           |
|        |                      |                                       |
| POST   | `/api/auth/register` | Register a new member                 |
| POST   | `/api/auth/login`    | Authenticate and create a session     |
| GET    | `/api/auth/me`       | Return the current authenticated user |
| POST   | `/api/auth/logout`   | Destroy the current session              |

Registration and login accept JSON request bodies.

Example registration:

```bash
curl -i -X POST http://127.0.0.1:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"testmember","password":"testpass123"}'
```

Example login:

```bash
curl -i -c cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"username":"testmember","password":"testpass123"}' \
  http://127.0.0.1:3000/api/auth/login
```

The `-c cookies.txt` option saves the session cookie for subsequent requests.

Check the session:

```bash
curl -i -b cookies.txt \
  http://127.0.0.1:3000/api/auth/me
```

Log out:

```bash
curl -i -b cookies.txt \
  -X POST http://127.0.0.1:3000/api/auth/logout
```

## Reproducing the Vulnerabilities

Start the application and authenticate before testing protected routes. The examples below assume the `testmember` account exists and `cookies.txt` contains a valid session cookie.

### IDOR

Request another user's registrations:

```bash
curl -i -b cookies.txt \
  http://127.0.0.1:3000/api/registrations/lab/vulnerable/users/2
```

Compare with the secured endpoint:

```bash
curl -i -b cookies.txt \
  http://127.0.0.1:3000/api/registrations/secure/users/2
```

With a suitable test fixture, the vulnerable endpoint returns the other user's registration data, while the secured endpoint rejects the request.

### Broken role authorization

Submit an event as an ordinary member:

```bash
curl -i -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"title":"Authorization Test","description":"Local demonstration"}' \
  http://127.0.0.1:3000/api/events/lab/vulnerable
```

Compare with:

```bash
curl -i -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"title":"Authorization Test","description":"Local demonstration"}' \
  http://127.0.0.1:3000/api/events/secure
```

The vulnerable endpoint permits the member to create an event; the secured endpoint rejects the same member.

### SQL injection

Use a harmless test payload against the local search endpoint:

```bash
curl -i -b cookies.txt --get \
  --data-urlencode "username=' OR '1'='1' -- " \
  http://127.0.0.1:3000/api/search/lab/vulnerable
```

Compare with the parameterized endpoint:

```bash
curl -i -b cookies.txt --get \
  --data-urlencode "username=' OR '1'='1' -- " \
  http://127.0.0.1:3000/api/search/secure
```

With the supplied test data, the vulnerable endpoint returns multiple user records, while the secured endpoint treats the payload as a literal username and returns no matches.

**Important:** These demonstrations are for the local lab only. Never use the payloads against third-party systems.

## Automated Testing

Trust Issues uses the built-in Node.js test runner. No additional test framework is required.

Run the tests:

```bash
npm test
```

The security regression suite starts a separate application instance, creates temporary test data, exercises the endpoints, and removes its temporary database afterward.

The suite verifies:

1. Unauthenticated requests to protected endpoints are rejected.
2. The IDOR demonstration exposes the test registration through the vulnerable endpoint but is blocked by the secured endpoint.
3. The role-authorization demonstration permits member event creation through the vulnerable endpoint but blocks it through the secured endpoint.
4. The SQL injection payload returns extra records through the vulnerable endpoint but no matches through the secured endpoint.

A passing suite indicates that these specific scenarios behave as expected. It does not prove the entire application is free of security vulnerabilities.

## Security Design

The application incorporates several security practices:

- **Password hashing:** Passwords are hashed with bcrypt rather than stored in plaintext.
- **Session management:** Authentication state is maintained through server-side sessions.
- **Session cookie settings:** The cookie uses `HttpOnly` and `SameSite=Lax`.
- **Parameterized SQL:** The secured search uses a bound parameter rather than interpolating user input into SQL.
- **Ownership enforcement:** The secured registration route checks resource ownership.
- **Role enforcement:** The secured event route checks the authenticated session's role.
- **Input validation:** Registration and event creation validate expected input formats and lengths.
- **Request body limit:** JSON request bodies are limited in size.

These controls are useful examples, not a complete production security configuration.

## Limitations

Trust Issues is an educational security lab, not a production-ready application.

Known limitations include:

- The vulnerable routes intentionally bypass selected security checks.
- The default Express session store is not suitable for production deployments.
- The local cookie configuration is designed for local HTTP testing, not production HTTPS.
- There is no complete administrative interface or full event-management workflow.
- Automated tests cover selected scenarios and are not exhaustive.
- Rate limiting, account lockout, CSRF protection, and a comprehensive security-header policy have not been fully implemented and verified.
- No claim is made that the application has undergone a complete penetration test or formal security audit.

The vulnerable endpoints should be disabled or removed before any deployment beyond an isolated local lab.

## Disclaimer

This project was created for educational purposes to understand web application vulnerabilities and their mitigations. All exploitation demonstrations must be limited to systems owned by the developer or explicitly authorized for testing.

**The presence of secured endpoints and passing regression tests does not imply that the entire application is secure.**
