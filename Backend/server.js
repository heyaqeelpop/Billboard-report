const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/database");
const cloudinary = require("cloudinary").v2; // ✅ Add Cloudinary import
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ Configure Cloudinary (add this)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Function to test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    console.log('🌤️ Testing Cloudinary connection...');
    
    // Simple API call to test connectivity
    const result = await cloudinary.api.ping();
    
    if (result && result.status === 'ok') {
      console.log('✅ Cloudinary connected successfully!');
      console.log(`📂 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      console.log(`🔑 API Key: ${process.env.CLOUDINARY_API_KEY?.substring(0, 8)}...`);
    } else {
      console.log('⚠️ Cloudinary connection test returned:', result);
    }
  } catch (error) {
    console.error('❌ Cloudinary connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Must supply api_key')) {
      console.error('🔑 Missing CLOUDINARY_API_KEY in .env file');
    } else if (error.message.includes('Must supply api_secret')) {
      console.error('🔐 Missing CLOUDINARY_API_SECRET in .env file');
    } else if (error.message.includes('Must supply cloud_name')) {
      console.error('☁️ Missing CLOUDINARY_CLOUD_NAME in .env file');
    }
  }
};

// ✅ API endpoint to check Cloudinary status
app.get('/api/cloudinary-status', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    
    res.json({
      success: true,
      message: 'Cloudinary is connected and working!',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status: result.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const reportRoutes = require("./src/routes/reportRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "Server is running!", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // ✅ Test Cloudinary connection on startup
    await testCloudinaryConnection();
    
    app.listen(PORT, () => {
      console.log("🎉 ==============================================");
      console.log("🚀 Billboard Reporting API Server Started!");
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
      console.log(`🌤️ Cloudinary: http://localhost:${PORT}/api/cloudinary-status`);
      console.log("🎉 ==============================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n👋 ${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start the server
startServer();
