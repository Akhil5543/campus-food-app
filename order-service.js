const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ path: "./order-service/.env" });
console.log("🧪 MONGO_URI loaded as:", process.env.MONGO_URI);


const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas (Order Service)"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Order Schema
const orderSchema = new mongoose.Schema({
  restaurantId: String,
  items: [
    {
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  totalAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model("Order", orderSchema, "orders");

// Create Order Endpoint
app.post("/orders", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: savedOrder });
  } catch (err) {
    console.error("❌ Failed to place order:", err);
    res.status(500).json({ message: "Failed to place order", error: err });
  }
});

// Optional: GET all orders (debug/test)
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving orders", error: err });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Order service running at http://localhost:${PORT}`);
});
