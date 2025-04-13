const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 4001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

const allowedOrigins = ["https://campus-food-app-git-main-mounikas-projects-5dc51961.vercel.app"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH"],
  credentials: true,
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB Atlas (Order Service)"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  restaurantId: String,
  restaurantName: String,
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

// ✅ PLACE NEW ORDER
app.post("/orders", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id?.toString(); // 🔧 Ensure it's stored as a string

    const newOrder = new Order({
      userId,
      restaurantId: req.body.restaurantId,
      restaurantName: req.body.restaurantName,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      status: "Received",
    });

    const savedOrder = await newOrder.save();
    console.log("✅ Order Saved:", savedOrder);

    res.status(201).json({ message: "Order placed successfully", order: savedOrder });
  } catch (err) {
    console.error("❌ Failed to place order:", err.message);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});

// ✅ GET user-specific orders
app.get("/orders/user/:userId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const authenticatedUserId = decoded.id?.toString(); // ✅ Ensure string comparison

    if (authenticatedUserId !== req.params.userId.toString()) {
      return res.status(403).json({ message: "Not authorized to view these orders" });
    }

    const orders = await Order.find({ userId: req.params.userId.toString() }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error("❌ Failed to fetch user orders:", err);
    res.status(500).json({ message: "Failed to fetch user orders", error: err.message });
  }
});

// ✅ GET vendor orders
app.get("/orders/vendor/:vendorId", async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.params.vendorId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor orders", error: err });
  }
});

// ✅ Update order status
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

// 🔁 Socket.io: Notify vendors
io.on("connection", (socket) => {
  socket.on("newOrderPlaced", () => {
    io.emit("refreshVendorOrders");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Order service running on http://localhost:${PORT}`);
});
