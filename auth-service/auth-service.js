const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4006;

// ✅ PostgreSQL connection (Render-compatible with SSL)
const pool = new Pool({
  connectionString: process.env.PG_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

const JWT_SECRET = process.env.JWT_SECRET;
const FROM_EMAIL = process.env.FROM_EMAIL;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(express.json());

// 📧 Send email with 6-digit code
const sendVerificationEmail = async (email, code) => {
  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: "Verify Your Email - Campus Food App",
    text: `Your verification code is: ${code}`,
    html: `<p>Your verification code is: <strong>${code}</strong></p>`,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error.message);
    throw new Error("Failed to send verification email.");
  }
};
// 🔐 JWT Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user info to req
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// 📝 Signup Route
app.post("/signup", async (req, res) => {
  const { name, email, password, role, dob, phone_number } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, verification_code, is_verified, dob, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, role`,
      [name, email, hashedPassword, role, verificationCode, false, dob || null, phone_number || null]
    );    

    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message: "Verification code sent to your email.",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// ✅ Email Verification Route
app.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || user.verification_code !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    await pool.query(
      "UPDATE users SET is_verified = true, verification_code = NULL WHERE email = $1",
      [email]
    );

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
});

// 🔐 Login Route
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1 AND role = $2", [email, role]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: "User not found or role mismatch" });
    if (!user.is_verified) return res.status(403).json({ message: "Please verify your email first." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        ownerId: user.role === "restaurant" ? user.owner_id : null,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// 🔁 Forgot Password - Send Reset Code via Email
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query("UPDATE users SET reset_code = $1 WHERE email = $2", [resetCode, email]);

    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: "Password Reset Code - Campus Food App",
      text: `Your reset code is: ${resetCode}`,
      html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>`,
    };

    await sgMail.send(msg);

    res.status(200).json({ message: "Reset code sent to your email." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to send reset code" });
  }
});

// // ✅ Reset Password
app.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (!user.rows.length || user.rows[0].reset_code !== code) {
      return res.status(400).json({ message: "Invalid code or email" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1, reset_code = NULL WHERE email = $2",
      [hashedPassword, email]
    );

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// ✅ Update Password (Settings tab)
app.patch("/update-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(403).json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNewPassword, userId]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ message: "Failed to update password" });
  }
});

// ✅ Update Profile Info (name or email)
app.patch("/update-profile", verifyToken, async (req, res) => {
  const { newName, newEmail } = req.body;
  const userId = req.user.id;

  if (!userId || (!newName && !newEmail)) {
    return res.status(400).json({ message: "Missing data to update." });
  }

  try {
    const updates = [];
    const values = [];

    if (newName) {
      updates.push("name = $" + (values.length + 1));
      values.push(newName);
    }

    if (newEmail) {
      updates.push("email = $" + (values.length + 1));
      values.push(newEmail);
    }

    values.push(userId);
    const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}`;

    await pool.query(updateQuery, values);

    res.status(200).json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

// ❌ Delete Account
app.delete("/delete-account", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found or already deleted" });
    }

    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Failed to delete account." });
  }
});
// ✅ Get current user profile (/me)
app.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT id, name, email, role, dob, phone_number FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get /me error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});


// 🚀 Start Server — LAST LINE!
app.listen(PORT, () => {
  console.log(`🚀 Auth service running at http://localhost:${PORT}`);
});
