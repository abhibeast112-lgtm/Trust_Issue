import { Router } from "express";
import db from "../db/database.js";

const router = Router();

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (req.session.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

function validateEvent(req, res, next) {
  const { title, description = "" } = req.body;

  if (typeof title !== "string" || !title.trim() || title.length > 150) {
    return res.status(400).json({ error: "Invalid event title" });
  }

  if (typeof description !== "string" || description.length > 2000) {
    return res.status(400).json({ error: "Invalid event description" });
  }

  req.eventInput = {
    title: title.trim(),
    description
  };

  next();
}

// INTENTIONALLY VULNERABLE: logged-in members can create events.
router.post(
  "/lab/vulnerable",
  requireLogin,
  validateEvent,
  (req, res) => {
    const result = db.prepare(`
      INSERT INTO events (title, description, created_by)
      VALUES (?, ?, ?)
    `).run(
      req.eventInput.title,
      req.eventInput.description,
      req.session.user.id
    );

    res.status(201).json({
      message: "Event created",
      eventId: Number(result.lastInsertRowid)
    });
  }
);

// FIXED: only admins may create events.
router.post(
  "/secure",
  requireLogin,
  requireAdmin,
  validateEvent,
  (req, res) => {
    const result = db.prepare(`
      INSERT INTO events (title, description, created_by)
      VALUES (?, ?, ?)
    `).run(
      req.eventInput.title,
      req.eventInput.description,
      req.session.user.id
    );

    res.status(201).json({
      message: "Event created",
      eventId: Number(result.lastInsertRowid)
    });
  }
);

export default router;
