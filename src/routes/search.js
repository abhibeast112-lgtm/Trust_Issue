import { Router } from "express";
import db from "../db/database.js";

const router = Router();

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// INTENTIONALLY VULNERABLE: user input becomes part of the SQL code.
router.get("/lab/vulnerable", requireLogin, (req, res) => {
  const username = String(req.query.username ?? "");

  try {
    const sql = `
      SELECT id, username, role
      FROM users
      WHERE username = '${username}'
    `;

    const users = db.prepare(sql).all();
    res.json({ users });
  } catch {
    res.status(400).json({ error: "Invalid search query" });
  }
});

// FIXED: user input is treated as data, not SQL code.
router.get("/secure", requireLogin, (req, res) => {
  const username = String(req.query.username ?? "");

  const users = db.prepare(`
    SELECT id, username, role
    FROM users
    WHERE username = ?
  `).all(username);

  res.json({ users });
});

export default router;
