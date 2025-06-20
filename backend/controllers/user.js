const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { createToken } = require("../utils/token-manager");

// Cookie configuration helper
// In your token-manager.js
const getCookieSettings = (req) => ({
  httpOnly: true,
  secure: true, // REQUIRED for Render.com (always HTTPS)
  sameSite: 'None', // REQUIRED for cross-origin on Render
  domain: 'chat-bot-0je8.onrender.com', // Your exact Render domain
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

// GET all users (admin/debug only — exclude passwords)
const getAllusers = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    return res.status(200).json({ message: "OK", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error", cause: error.message });
  }
};

// POST /signup
const userSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Create JWT token
    const token = createToken(user._id.toString(), user.email, "7d");

    // Set secure cookie with dynamic settings
    res.cookie("auth_token", token, getCookieSettings(req));

    return res.status(201).json({
      message: "User created successfully",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Signup failed", cause: error.message });
  }
};

// POST /login
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not registered" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Incorrect password" });
    }

    // Create JWT token
    const token = createToken(user._id.toString(), user.email, "7d");

    // Set secure cookie with dynamic settings
    res.cookie("auth_token", token, getCookieSettings(req));

    return res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed", cause: error.message });
  }
};

// GET /auth-status (Verify Token)
const verifyUser = async (req, res) => {
  try {
    const userId = res.locals.jwtData?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - no token data" });
    }

    const user = await User.findById(userId, "-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Authorized user",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Auth check failed:", error);
    return res.status(500).json({ message: "Authorization failed", cause: error.message });
  }
};

// POST /logout
const logoutuser = (req, res) => {
  try {
    res.clearCookie("auth_token", getCookieSettings(req));
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      cause: error.message,
    });
  }
};

module.exports = {
  getAllusers,
  userSignup,
  userLogin,
  verifyUser,
  logoutuser,
};