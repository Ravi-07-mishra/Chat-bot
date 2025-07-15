// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { createToken } = require("../utils/token-manager");

// Cookie configuration helper
const getCookieSettings = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// GET all users
const getAllUsers = async (req, res) => {
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

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Create token and set cookie
    const token = createToken(user._id.toString(), user.email, "7d");
    res.cookie("bot_token", token, getCookieSettings());

    return res.status(201).json({
      message: "User created successfully",
      user: { id: user._id, name: user.name, email: user.email },
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
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = createToken(user._id.toString(), user.email, "7d");
    res.cookie("bot_token", token, getCookieSettings());

    return res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed", cause: error.message });
  }
};

// GET /verify
const verifyUser = async (req, res) => {
  try {
    const userId = res.locals.jwtData?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await User.findById(userId, "-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.status(200).json({
      message: "Authorized",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Auth check failed:", error);
    return res.status(500).json({ message: "Authorization failed", cause: error.message });
  }
};

// POST /logout
const logoutUser = (req, res) => {
  try {
    res.clearCookie("bot_token", { 
      ...getCookieSettings(), 
      maxAge: 0 
    });
    
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Logout failed", cause: error.message });
  }
};

module.exports = {
  getAllUsers,
  userSignup,
  userLogin,
  verifyUser,
  logoutUser,
};