const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 4003;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Schema
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

// ✅ GET vendor by ownerId (for restaurant login)
app.get("/vendor/owner/:ownerId", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ ownerId: req.params.ownerId });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vendor", error: err });
  }
});

// POST /vendor/:id/menu - Add menu item
app.post("/vendor/:id/menu", async (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Item name and price are required." });
  }

  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    if (!vendor.menu) vendor.menu = [];

    vendor.menu.push({ 
       _id: new mongoose.Types.ObjectId(),   
       name,
       price,
       description,
       outOfStock: false,                    
       todaysSpecial: false
    });
    vendor.markModified("menu");
    await vendor.save();

    res.status(201).json({ message: "✅ Menu item added", menu: vendor.menu });
  } catch (err) {
    res.status(500).json({ message: "Error adding item", error: err });
  }
});

// PUT /vendor/:id/menu/:itemId/out-of-stock - Mark menu item as out of stock
app.put("/vendor/:id/menu/:itemId/out-of-stock", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const itemIndex = vendor.menu.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ message: "Menu item not found" });

    // Mark item as out of stock
    vendor.menu[itemIndex].outOfStock = true;
    vendor.markModified("menu");
    await vendor.save();

    res.status(200).json({ message: "✅ Item marked as out of stock", menu: vendor.menu });
  } catch (err) {
    res.status(500).json({ message: "Error marking item out of stock", error: err });
  }
});
// PUT /vendor/:id/menu/:itemId/todays-special - Toggle Today's Special
app.put("/vendor/:id/menu/:itemId/todays-special", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const itemIndex = vendor.menu.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ message: "Menu item not found" });

    // Toggle today's special status
    vendor.menu[itemIndex].todaysSpecial = req.body.todaysSpecial;
    vendor.markModified("menu");
    await vendor.save();

    res.status(200).json({ message: "✅ Item's Today's Special status updated", menu: vendor.menu });
  } catch (err) {
    res.status(500).json({ message: "Error updating Today's Special", error: err });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Vendor service running at http://localhost:${port}`);
});
