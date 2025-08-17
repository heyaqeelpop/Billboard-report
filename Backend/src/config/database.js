const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Removed deprecated options: useNewUrlParser and useUnifiedTopology
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/billboard_reports"
    );
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
