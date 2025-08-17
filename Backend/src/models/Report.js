const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: {
    address: { type: String, required: true },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  billboardDetails: {
    size: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String }, // ✅ Made optional
  },
  dateObserved: {
    type: Date,
    required: true,
  },
  dateReported: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  // ✅ NEW: Add image fields
  imageUrl: {
    type: String, // Store the URL/path to the image
    required: function () {
      // Make image required only for public users
      return this.reporterId && this.reporterId.role === "public";
    },
  },
  imageFileName: {
    type: String, // Store original filename
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  verificationNotes: String,
});

module.exports = mongoose.model("Report", reportSchema);
