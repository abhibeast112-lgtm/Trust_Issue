
import { Router } from "express";
import db from "../db/database.js";

const router = Router();

// Helper: reject requests without a logged-in session.
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  next();
}

// INTENTIONALLY VULNERABLE: local security demonstration only.
// The route checks login but does not check resource ownership.
router.get("/lab/vulnerable/users/:userId", requireLogin, (req, res) => {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const registrations = db.prepare(`
    SELECT registrations.id, registrations.event_id, events.title,
           registrations.registered_at
    FROM registrations
    JOIN events ON events.id = registrations.event_id
    WHERE registrations.user_id = ?
  `).all(userId);

  return res.json({ registrations });
});

// FIXED: users can only read their own registration records.
router.get("/secure/users/:userId", requireLogin, (req, res) => {
  const requestedUserId = Number(req.params.userId);

  if (
    !Number.isInteger(requestedUserId) ||
    requestedUserId < 1
  ) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  if (requestedUserId !== req.session.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const registrations = db.prepare(`
    SELECT registrations.id, registrations.event_id, events.title,
           registrations.registered_at
    FROM registrations
    JOIN events ON events.id = registrations.event_id
    WHERE registrations.user_id = ?
  `).all(req.session.user.id);

  return res.json({ registrations });
});

export default router;
