// routes/userRoutes.js
const express = require("express");
const { getAllusers, userSignup, userLogin, verifyUser, logoutuser } = require("../controllers/user");
const { validate, signupValidator, LoginValidator } = require("../utils/validators");
const { verifyToken } = require("../utils/token-manager");

const userRoutes = express.Router();

// GET all users (admin/debug)
userRoutes.get("/", getAllusers);

// POST /signup
userRoutes.post("/signup", validate(signupValidator), userSignup);

// POST /login
userRoutes.post("/login", validate(LoginValidator), userLogin);

// GET /auth-status
userRoutes.get("/auth-status", verifyToken, verifyUser);

// POST /logout
userRoutes.post("/logout", logoutuser);

module.exports = userRoutes;
