const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// IMPORTANT: Middleware order matters!
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON requests - MUST be before routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Request body size:", JSON.stringify(req.body).length);
  }
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    message: "🎯 Billboard API is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Billboard Reporting API",
    status: "Active",
    endpoints: [
      "POST /api/auth/register - Register new user",
      "POST /api/auth/login - Login user",
      "GET /api/reports - Get reports (auth required)",
      "POST /api/reports - Create report (auth required)",
      "PUT /api/reports/:id - Update report (organization only)",
    ],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// ✅ Express v5 compatible - named wildcard
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
  console.log(`📊 Reports endpoints: http://localhost:${PORT}/api/reports/`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received. Shutting down gracefully...");
  process.exit(0);
});
