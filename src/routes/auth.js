
import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../db/database.js";

const router = Router();

// Register a new member.
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !/^[a-zA-Z0-9_]{3,30}$/.test(username) ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        error:
          "Username must be 3–30 letters, numbers or underscores; password must be 8–72 characters."
      });
    }

    const existingUser = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);

    if (existingUser) {
      return res.status(409).json({
        error: "Username is already taken"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = db
      .prepare(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)"
      )
      .run(username, passwordHash);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: Number(result.lastInsertRowid),
        username,
        role: "member"
      }
    });
  } catch (error) {
    console.error("Registration failed:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

// Log in an existing user.
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 30 ||
      password.length > 72
    ) {
      return res.status(400).json({
        error: "Invalid username or password"
      });
    }

    const user = db
      .prepare(
        "SELECT id, username, password_hash, role FROM users WHERE username = ?"
      )
      .get(username);

    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration failed:", error);
        return res.status(500).json({
          error: "Internal server error"
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);
          return res.status(500).json({
            error: "Internal server error"
          });
        }

        return res.json({
          message: "Login successful",
          user: req.session.user
        });
      });
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});
router.get("/me", (req, res) => {
  if(!req.session.user){
    return res.status(401).json ({
      error: "Not autehnticated"
    });
  }
  return res.json({
    user: req.session.user
  });
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("trust.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });
    return res.json({ message: "Logged out successfully" });
  });
});

export default router;
