const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: {
    address: { type: String, required: true },
    coordinates: { lat: Number, lng: Number },
  },
  photos: [String],
  // ✅ FIXED: Define billboardDetails as nested object, not String
  billboardDetails: {
    size: { type: String },
    type: { type: String },
    content: { type: String },
  },
  dateReported: { type: Date, default: Date.now },
  dateObserved: Date,
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  verificationNotes: String,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Report", ReportSchema);
