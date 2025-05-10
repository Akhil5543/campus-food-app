const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
//const Stripe = require("stripe");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4005;

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ Stripe initialized

// ✅ Define CORS Options
const allowedOrigins = [
  "https://campus-food-app.vercel.app",
  "https://campus-food-app-git-main-mounikas-projects-5dc51961.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || origin.includes("vercel.app")) {
      callback(null, true);
    } else {
      console.error("❌ CORS blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// ✅ PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.PG_URI,
  ssl: { rejectUnauthorized: false },
});

// ✅ New API: Create Stripe Payment Intent
app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe needs cents
      currency: "usd",
      payment_method_types: ["card"],
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("❌ Stripe PaymentIntent Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ✅ Existing API: Record Payment in DB
app.post("/payments", async (req, res) => {
  const { user_id, order_id, amount, method, status } = req.body;

  if (!user_id || !order_id || !amount || !method || !status) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  try {
    const query = `
      INSERT INTO payments (user_id, order_id, amount, method, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [user_id, order_id, amount, method, status];
    const result = await pool.query(query, values);

    return res.status(201).json({
      message: "✅ Payment recorded successfully",
      payment: result.rows[0],
    });
  } catch (error) {
    console.error("❌ PostgreSQL Insert Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Payment service running on port ${PORT}`);
});
