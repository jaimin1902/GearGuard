import pool from "../db/connection.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Password validation function
function validatePassword(password) {
  const errors = [];
  
  if (password.length <= 8) {
    errors.push("Password must be more than 8 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return errors;
}

// Sign Up (Register)
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, reEnterPassword } = req.body;

    // Validation
    if (!name || !email || !password || !reEnterPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if passwords match
    if (password !== reEnterPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors.join(", ") });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create portal user (role: 'user')
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, name, email, role`,
      [name, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Sign In (Login)
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT id, name, email, password, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not exist" });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid Password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password (placeholder - you can implement email sending later)
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email exists
    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not exist" });
    }

    // TODO: Send password reset email
    // For now, just return success
    res.json({
      message: "Password reset instructions sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

// Get current user (verify token)
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, avatar_url, department_id
      FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

