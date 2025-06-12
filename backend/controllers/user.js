const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { createToken } = require("../utils/token-manager");

const getAllusers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json({ message: "OK", users });
  } catch (error) {
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

const userSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existinguser = await User.findOne({ email });
    if (existinguser) {
      return res.status(401).send("User already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hash });
    await user.save();

    const token = createToken(user._id.toString(), user.email, "7d");

    return res.status(201).json({
      message: "User created",
      name: user.name,
      email: user.email,
      token, // ✅ Include token
    });
  } catch (error) {
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send("User not registered");
    }

    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res.status(403).send("Incorrect Password");
    }

    const token = createToken(user._id.toString(), user.email, "7d");

    return res.status(200).json({
      message: "Successful login",
      name: user.name,
      email: user.email,
      token, // ✅ Include token
    });
  } catch (error) {
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered or token is wrong");
    }

    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }

    return res.status(200).json({
      message: "Authorized user",
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

const logoutuser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error logging out",
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
