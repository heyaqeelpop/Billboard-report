const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB Atlas...");

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Connection pool
      retryWrites: true, // Retry failed writes
      w: "majority", // Write concern
    });

    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB Atlas error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB Atlas disconnected");
    });
  } catch (error) {
    console.error(`❌ MongoDB Atlas connection failed: ${error.message}`);
    console.error("🔍 Error details:", error.name);
    process.exit(1); // Exit on connection failure
  }
};

module.exports = connectDB;
