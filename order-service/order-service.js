const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 4002;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB Atlas (Order Service)"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const orderSchema = new mongoose.Schema({
  restaurantId: String,
  userId: String,
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  totalAmount: Number,
  status: {
    type: String,
    default: "Received",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema, "orders");

// ✅ PLACE NEW ORDER (with userId safely included)
app.post("/orders", async (req, res) => {
  try {
    const { restaurantId, userId, items, totalAmount } = req.body;

    const newOrder = new Order({
      restaurantId,
      userId,
      items,
      totalAmount
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({ message: "Order placed successfully", order: savedOrder });
  } catch (err) {
    res.status(500).json({ message: "Failed to place order", error: err });
  }
});

// ✅ GET ALL ORDERS
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err });
  }
});

// ✅ GET ORDERS BY VENDOR
app.get("/orders/vendor/:vendorId", async (req, res) => {
  const { vendorId } = req.params;
  try {
    const orders = await Order.find({ restaurantId: vendorId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor orders", error: err });
  }
});

// ✅ GET ORDERS BY USER
app.get("/orders/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user orders", error: err });
  }
});

// ✅ UPDATE ORDER STATUS
app.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    io.emit("orderStatusUpdated", {
      orderId: updatedOrder._id,
      status: updatedOrder.status
    });

    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err });
  }
});

// 🔁 Socket for real-time vendor refresh
io.on("connection", (socket) => {
  socket.on("newOrderPlaced", () => {
    io.emit("refreshVendorOrders");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Order service running on http://localhost:${PORT}`);
});
