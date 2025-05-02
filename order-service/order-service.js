const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by Socket.IO CORS: " + origin));
      }
    },
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  }
});

const allowedOrigins = [
  "https://campus-food-app.vercel.app",
  "https://campus-food-app-git-main-mounikas-projects-5dc51961.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    console.log("\uD83C\uDF10 Incoming Origin:", origin);
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
}));

app.options("*", cors());
console.log("\uD83D\uDEA8 CORS middleware is running...");
app.use(express.json());

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
  customerName: String,
  items: [{ name: String, price: Number, quantity: Number }],
  totalAmount: Number,
  status: { type: String, default: "Received" },
  createdAt: { type: Date, default: Date.now },
});

const favoriteOrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  items: [{ itemId: String, name: String, price: Number, quantity: Number }],
}, { timestamps: true });

const feedbackSchema = new mongoose.Schema({
  orderId: String,
  vendorId: String,
  userId: String,
  rating: Number,
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema, "orders");
const FavoriteOrder = mongoose.model("FavoriteOrder", favoriteOrderSchema, "favorite_orders");
const Feedback = mongoose.model("Feedback", feedbackSchema, "feedbacks");

app.post("/orders", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id?.toString();

    const newOrder = new Order({
      userId,
      restaurantId: req.body.restaurantId,
      restaurantName: req.body.restaurantName,
      customerName: req.body.customerName,
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

app.get("/orders/user/:userId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const authenticatedUserId = decoded.id?.toString();

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

app.get("/orders/vendor/:vendorId", async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.params.vendorId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor orders", error: err });
  }
});

app.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    io.emit("orderStatusUpdated", {
      orderId: updatedOrder._id,
      status: updatedOrder.status,
      vendorName: updatedOrder.restaurantName,
      createdAt: updatedOrder.createdAt,
    });

    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: "Failed to update status", error: err });
  }
});

app.post("/favorite-order", async (req, res) => {
  try {
    const { userId, vendorId, vendorName, items } = req.body;
    if (!userId || !vendorId || !vendorName || !items) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newFavorite = new FavoriteOrder({ userId, vendorId, vendorName, items });
    const savedFavorite = await newFavorite.save();

    res.status(201).json({ message: "Favorite order saved", favorite: savedFavorite });
  } catch (err) {
    res.status(500).json({ message: "Failed to save favorite", error: err.message });
  }
});

app.get("/favorite-order/user/:userId", async (req, res) => {
  try {
    const favorites = await FavoriteOrder.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch favorites", error: err.message });
  }
});

app.delete("/favorite-order/:id", async (req, res) => {
  try {
    const deleted = await FavoriteOrder.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Favorite not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

app.post("/feedback", async (req, res) => {
  try {
    const { orderId, vendorId, userId, rating, comment } = req.body;
    const existing = await Feedback.findOne({ orderId, userId });
    if (existing) return res.status(400).json({ message: "Feedback already submitted." });

    const feedback = new Feedback({ orderId, vendorId, userId, rating, comment });
    await feedback.save();

    res.status(200).json({ message: "Feedback submitted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

app.get("/vendor/:vendorId/average-rating", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const result = await Feedback.aggregate([
      { $match: { vendorId } },
      { $group: { _id: "$vendorId", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
    ]);
    if (result.length === 0) return res.json({ averageRating: 0, totalReviews: 0 });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

io.on("connection", (socket) => {
  socket.on("newOrderPlaced", () => {
    io.emit("refreshVendorOrders");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Order service running on port ${PORT}`);
});
