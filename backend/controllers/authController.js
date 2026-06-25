// Auth Controller
// Handles signup and login business logic.
// Uses bcryptjs to hash passwords — never store plain text passwords.
// Issues JWT on successful login — the client stores this and sends it with every request.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../utils/supabase");

async function signup(req, res, next) {
  try {
    const { username, password, role } = req.body;

    // Basic presence + role validation before touching the database
    if (!username || !password || !role) {
      return res.status(400).json({ error: "username, password, and role are required" });
    }

    if (!["recruiter", "candidate"].includes(role)) {
      return res.status(400).json({ error: "role must be 'recruiter' or 'candidate'" });
    }

    // Hash password with cost factor 10 (good balance of speed vs security)
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("profiles")
      .insert({ username, password_hash, role })
      .select("id, username, role")
      .single();

    if (error) {
      // Supabase returns code 23505 for unique constraint violations
      if (error.code === "23505") {
        return res.status(409).json({ error: "Username already taken" });
      }
      throw error;
    }

    // Sign a JWT immediately so the new user is logged in right after signup
    const token = jwt.sign(
      { id: data.id, username: data.username, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user: data });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, username, password_hash, role")
      .eq("username", username)
      .single();

    // Same generic error for "user not found" and "wrong password" —
    // avoids leaking which usernames exist in the system
    if (error || !user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
