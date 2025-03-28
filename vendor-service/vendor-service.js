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

app.listen(port, () => {
  console.log(`🚀 Vendor service running at http://localhost:${port}`);
});
