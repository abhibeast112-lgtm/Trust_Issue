import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const tempDir = mkdtempSync(path.join(tmpdir(), "trust-issues-test-"));
const dbPath = path.join(tempDir, "test.db");
const port = 3198;
const baseUrl = `http://127.0.0.1:${port}`;

let server;
let aliceCookie;
let aliceId;
let bobId;

async function request(route, options = {}) {
  return fetch(`${baseUrl}${route}`, options);
}

async function register(username) {
  const response = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password: "testpass123"
    })
  });

  assert.equal(response.status, 201, `Registration failed for ${username}`);
  return (await response.json()).user;
}

async function login(username) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password: "testpass123"
    })
  });

  assert.equal(response.status, 200, `Login failed for ${username}`);

  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "Login should set a session cookie");

  return {
    user: (await response.json()).user,
    cookie: cookie.split(";")[0]
  };
}

before(async () => {
  server = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      SESSION_SECRET: "test-only-secret-for-automated-tests",
      TRUST_ISSUES_DB_PATH: dbPath
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let serverOutput = "";
  server.stdout.on("data", chunk => { serverOutput += chunk; });
  server.stderr.on("data", chunk => { serverOutput += chunk; });

  let ready = false;

  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) {
      throw new Error(`Test server exited early:\n${serverOutput}`);
    }

    try {
      const response = await request("/health");
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      // Server may still be starting.
    }

    await delay(250);
  }

  if (!ready) {
    throw new Error(`Test server did not start:\n${serverOutput}`);
  }

  const alice = await register("testalice");
  const bob = await register("testbob");
  aliceId = alice.id;
  bobId = bob.id;

  const loginResult = await login("testalice");
  aliceCookie = loginResult.cookie;
  assert.equal(loginResult.user.role, "member");

  // Seed only the temporary test database.
  const db = new Database(dbPath);
  const event = db.prepare(`
    INSERT INTO events (title, description, created_by)
    VALUES (?, ?, ?)
  `).run("Test Workshop", "Automated security test", aliceId);

  db.prepare(`
    INSERT INTO registrations (user_id, event_id)
    VALUES (?, ?)
  `).run(bobId, Number(event.lastInsertRowid));

  db.close();
});

after(() => {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
  }

  rmSync(tempDir, { recursive: true, force: true });
});

test("protected endpoints reject unauthenticated requests", async () => {
  const response = await request(
    `/api/registrations/secure/users/${aliceId}`
  );

  assert.equal(response.status, 401);
});

test("IDOR: vulnerable route exposes Bob's registration, secure route blocks Alice", async () => {
  const vulnerable = await request(
    `/api/registrations/lab/vulnerable/users/${bobId}`,
    { headers: { Cookie: aliceCookie } }
  );

  assert.equal(vulnerable.status, 200);

  const vulnerableBody = await vulnerable.json();
  assert.ok(
    vulnerableBody.registrations.some(row => row.title === "Test Workshop")
  );

  const secure = await request(
    `/api/registrations/secure/users/${bobId}`,
    { headers: { Cookie: aliceCookie } }
  );

  assert.equal(secure.status, 403);
});

test("role authorization: member can create through vulnerable route but not secure route", async () => {
  const body = JSON.stringify({
    title: "Authorization Test",
    description: "Created by automated test"
  });

  const vulnerable = await request("/api/events/lab/vulnerable", {
    method: "POST",
    headers: {
      Cookie: aliceCookie,
      "Content-Type": "application/json"
    },
    body
  });

  assert.equal(vulnerable.status, 201);

  const secure = await request("/api/events/secure", {
    method: "POST",
    headers: {
      Cookie: aliceCookie,
      "Content-Type": "application/json"
    },
    body
  });

  assert.equal(secure.status, 403);
});

test("SQL injection returns extra rows only from the vulnerable endpoint", async () => {
  const payload = "' OR '1'='1' -- ";

  const vulnerableUrl = new URL("/api/search/lab/vulnerable", baseUrl);
  vulnerableUrl.searchParams.set("username", payload);

  const vulnerable = await fetch(vulnerableUrl, {
    headers: { Cookie: aliceCookie }
  });

  assert.equal(vulnerable.status, 200);
  const vulnerableBody = await vulnerable.json();
  assert.ok(vulnerableBody.users.length >= 2);

  const secureUrl = new URL("/api/search/secure", baseUrl);
  secureUrl.searchParams.set("username", payload);

  const secure = await fetch(secureUrl, {
    headers: { Cookie: aliceCookie }
  });

  assert.equal(secure.status, 200);
  const secureBody = await secure.json();
  assert.deepEqual(secureBody.users, []);
});
