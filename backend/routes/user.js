const express = require("express");
const { 
  getAllusers, 
  userSignup, 
  userLogin, 
  verifyUser, 
  logoutuser 
} = require("../controllers/user");
const { validate, signupValidator, loginValidator } = require("../utils/validators");
const { verifyToken } = require("../utils/token-manager");

const userRoutes = express.Router();

// GET all users (admin/debug)
userRoutes.get("/", getAllusers);

// User authentication
userRoutes.post("/register", validate(signupValidator), userSignup);
userRoutes.post("/login", validate(loginValidator), userLogin);
userRoutes.get("/verify", verifyToken, verifyUser);
userRoutes.post("/logout", logoutuser);

module.exports = userRoutes;