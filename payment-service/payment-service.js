// payment-service.js
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4005;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.PG_URI,
});

// Payment Endpoint
app.post("/payments", async (req, res) => {
  const { user_id, order_id, amount, method, status } = req.body;

  // Log the incoming request body
  console.log("📥 Incoming Payment Request:", req.body);

  // Check if required fields are present
  if (!user_id || !order_id || !amount || !method || !status) {
    console.error("❌ Missing required payment fields");
    return res.status(400).json({ message: "Missing payment details" });
  }

  try {
    const query = `
      INSERT INTO payments (user_id, order_id, amount, method, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const values = [user_id, order_id, amount, method, status];

    // Log the query and values for debugging
    console.log("🧾 Running Query:", query);
    console.log("📊 With Values:", values);

    const result = await pool.query(query, values);

    console.log("✅ Payment saved:", result.rows[0]);
    res.status(201).json({
      message: "✅ Payment recorded successfully",
      payment: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Payment insertion error:", error);
    res.status(500).json({
      message: "❌ Failed to record payment",
      error: error.message,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Payment service running at http://localhost:${PORT}`);
});
