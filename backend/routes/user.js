const express = require("express");
const { 
  getAllUsers, 
  userSignup, 
  userLogin, 
  verifyUser, 
  logoutUser ,
  sendOtp
} = require("../controllers/user");
const { validate, signupValidator, loginValidator } = require("../utils/validators");
const { verifyToken } = require("../utils/token-manager");

const userRoutes = express.Router();

// GET all users (admin/debug)
userRoutes.get("/", getAllUsers);

// User authentication
userRoutes.post("/register", validate(signupValidator), userSignup);
userRoutes.post("/login", validate(loginValidator), userLogin);
userRoutes.get("/verify", verifyToken, verifyUser);
userRoutes.post("/logout", logoutUser);
userRoutes.post('/sendotp',sendOtp);
module.exports = userRoutes;