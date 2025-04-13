const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas (Order Service)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  restaurantId: String,
  restaurantName: String, // ✅ Added this
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalAmount: Number,
  status: { type: String, default: "Received" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema, "orders");

// POST: Place an order (requires JWT)
app.post("/orders", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const newOrder = new Order({
      userId,
      restaurantId: req.body.restaurantId,
      restaurantName: req.body.restaurantName, // ✅ Save restaurant name
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      status: "Received",
    });

    const savedOrder = await newOrder.save();
    console.log("✅ Order Saved:", savedOrder);
    res.status(201).json({ message: "Order placed successfully", order: savedOrder });
  } catch (err) {
    console.error("❌ Failed to place order:", err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});

// GET: Fetch all orders (debug/admin)
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// GET: Fetch user-specific orders
app.get("/orders/user/:userId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const authenticatedUserId = decoded.id;

    if (authenticatedUserId !== req.params.userId) {
      return res.status(403).json({ message: "Not authorized to view these orders" });
    }

    const orders = await Order.find({ userId: authenticatedUserId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error("❌ Failed to fetch user orders:", err);
    res.status(500).json({ message: "Failed to fetch user orders", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Order service running at http://localhost:${PORT}`);
});
