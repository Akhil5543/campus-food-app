const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  vendorId: { type: String, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Feedback", feedbackSchema, "feedback");
