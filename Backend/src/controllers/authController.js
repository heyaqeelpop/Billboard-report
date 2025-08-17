const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    console.log("📝 Registration attempt:", { name, email, role });

    // ✅ Validation
    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res
        .status(400)
        .json({ error: "User already exists with this email" });
    }

    // ✅ Hash password properly
    console.log("🔐 Hashing password...");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("✅ Password hashed successfully");

    // ✅ Create new user instance
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || "public",
    });

    console.log("💾 Attempting to save user to database...");

    // ✅ CRITICAL: Properly await the save operation
    const savedUser = await newUser.save();
    console.log("✅ User saved successfully:", savedUser._id);

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        role: savedUser.role,
        email: savedUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("✅ Registration complete for:", email);

    // ✅ Send success response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);

    // ✅ Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `${field} already exists`,
      });
    }

    if (error.name === "ValidationError") {
      // Mongoose validation error
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      error: "Internal server error during registration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔄 Login attempt for:", email);

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // ✅ Find user with password field included
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    console.log("👤 User found:", user ? "YES" : "NO");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Compare password properly
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("🔐 Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("✅ Login successful for:", email);

    // ✅ Send response
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { register, login };
