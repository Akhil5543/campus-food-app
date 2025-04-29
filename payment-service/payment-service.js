const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4005;

// ✅ Define CORS Options First
const allowedOrigins = [
  "https://campus-food-app.vercel.app",
  "https://campus-food-app-git-main-mounikas-projects-5dc51961.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      origin.includes("vercel.app") 
    ) {
      callback(null, true);
    } else {
      console.error("❌ CORS blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};


// ✅ Apply CORS Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// ✅ PostgreSQL connection for Render (SSL required)
const pool = new Pool({
  connectionString: process.env.PG_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 💳 Payment Endpoint
app.post("/payments", async (req, res) => {
  const { user_id, order_id, amount, method, status } = req.body;

  console.log("📥 Incoming Payment Request:", req.body);

  if (!user_id || !order_id || !amount || !method || !status) {
    console.error("❌ Missing required payment fields", { user_id, order_id, amount, method, status });
    return res.status(400).json({ message: "Missing payment details" });
  }

  try {
    const query = `
      INSERT INTO payments (user_id, order_id, amount, method, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const values = [user_id, order_id, amount, method, status];

    console.log("🧾 Running Query:", query);
    console.log("📊 With Values:", values);

    const result = await pool.query(query, values);

    console.log("✅ Payment saved successfully:", result.rows[0]);

    return res.status(201).json({
      message: "✅ Payment recorded successfully",
      payment: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Payment insertion error:", error.message);
    return res.status(500).json({
      message: "❌ Failed to record payment",
      error: error.message,
    });
  }
});

// 🚀 Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Payment service live on port ${PORT}`);
});
