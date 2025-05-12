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
   const ownerId = req.params.ownerId; // ✅ leave it as string
   console.log(`Searching for vendor with ownerId: ${ownerId}`);
   const vendor = await Vendor.findOne({ ownerId }); // ✅ match as string
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vendor", error: err });
  }
});
// DELETE /vendor/:id/menu/:itemId - Remove a menu item by ID
app.delete("/vendor/:id/menu/:itemId", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const itemIndex = vendor.menu.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ message: "Menu item not found" });

    // Remove the item from the menu array
    vendor.menu.splice(itemIndex, 1);
    vendor.markModified("menu");
    await vendor.save();

    res.status(200).json({ message: "✅ Menu item deleted", menu: vendor.menu });
  } catch (err) {
    res.status(500).json({ message: "Error deleting menu item", error: err });
  }
});

// POST /vendor/:id/menu - Add menu item
app.post("/vendor/:id/menu", async (req, res) => {
  const { name, price, description, category, available, todaysSpecial } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ message: "Item name, price, and category are required." });
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
      category,
      available: available ?? true,
      outOfStock: false,
      todaysSpecial: todaysSpecial ?? false,
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

// PUT /vendor/:id/menu/:itemId/in-stock - Mark menu item as in stock
app.put("/vendor/:id/menu/:itemId/in-stock", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const itemIndex = vendor.menu.findIndex(item => item._id.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ message: "Menu item not found" });

    // Mark item as in stock
    vendor.menu[itemIndex].outOfStock = false;
    vendor.markModified("menu");
    await vendor.save();

    res.status(200).json({ message: "✅ Item marked as in stock", menu: vendor.menu });
  } catch (err) {
    res.status(500).json({ message: "Error marking item in stock", error: err });
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

// ✅ POST /vendor/create - Automatically create vendor profile on signup
app.post("/vendor/create", async (req, res) => {
  try {
    const { ownerId, name, address, hours } = req.body;

    if (!ownerId || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Prevent duplicate vendor entries
    const existing = await Vendor.findOne({ ownerId });
    if (existing) {
      return res.status(400).json({ message: "Vendor already exists for this owner." });
    }

    const newVendor = new Vendor({
      ownerId,
      name,
      address: address || "Default Block",
      hours: hours || "09:00 AM – 09:00 PM",
      menu: [],
      avgRating: "0.0"
    });

    const saved = await newVendor.save();
    res.status(201).json({ message: "Vendor profile created", vendor: saved });
  } catch (err) {
    console.error("❌ Error creating vendor:", err);
    res.status(500).json({ message: "Error creating vendor", error: err.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`🚀 Vendor service running at http://localhost:${port}`);
});

