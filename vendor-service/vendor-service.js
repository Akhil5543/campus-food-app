const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // For .env support

console.log("🌐 MONGO_URI:", process.env.MONGO_URI);

const app = express();
const port = 4003;

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Vendor Schema
const vendorSchema = new mongoose.Schema({}, { strict: false });
const Vendor = mongoose.model("Vendor", vendorSchema, "vendors");

// ✅ GET all vendors
app.get("/vendors", async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    res.json(vendors);
  } catch (err) {
    console.error("❌ Error fetching vendors:", err);
    res.status(500).json({ message: "Failed to fetch vendors", error: err });
  }
});

// GET vendor by ID
app.get("/vendor/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vendor", error: err });
  }
});

// POST /vendor/:id/menu - Add a new menu item
app.post("/vendor/:id/menu", async (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Item name and price are required." });
  }

  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!vendor.menu) vendor.menu = [];

    vendor.menu.push({ name, price });
    await vendor.save();

    res.status(201).json({
      message: "✅ Menu item added successfully",
      menu: vendor.menu,
    });
  } catch (err) {
    console.error("❌ Error adding menu item:", err);
    res.status(500).json({ message: "Error adding item", error: err });
  }
});

app.listen(port, () => {
  console.log(`🚀 Vendor service running at http://localhost:${port}`);
});
