import db from "../src/db/database.js";

const alice = db.prepare(
  "SELECT id FROM users WHERE username = ?"
).get("testmember");

const bob = db.prepare(
  "SELECT id FROM users WHERE username = ?"
).get("testbob");

if (!alice || !bob) {
  console.error("Missing test users: testmember or testbob");
  process.exitCode = 1;
} else {
  const result = db.prepare(
    "INSERT INTO events (title, description, created_by) VALUES (?, ?, ?)"
  ).run(
    "Security Lab Workshop",
    "Sample event for access-control testing",
    alice.id
  );

  db.prepare(
    "INSERT INTO registrations (user_id, event_id) VALUES (?, ?)"
  ).run(bob.id, Number(result.lastInsertRowid));

  console.log("Created event and Bob registration.");
}

db.close();
