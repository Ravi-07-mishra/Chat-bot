const express = require('express');
const { getAllusers, userSignup, userLogin, verifyUser, logoutuser } = require('../controllers/user');
const { validate, signupValidator, LoginValidator } = require('../utils/validators');
const { verifyToken } = require('../utils/token-manager');

const userRoutes  = express.Router();

// GET route for fetching all users
userRoutes.route("/").get(getAllusers);

// POST route for user signup with validation middleware
userRoutes.route("/signup")
  .post(validate(signupValidator), userSignup);
userRoutes.route("/login")
  .post(validate(LoginValidator), userLogin);
userRoutes.route("/auth-status")
  .get(verifyToken,verifyUser);
userRoutes.route('/logout').post(logoutuser);

module.exports = userRoutes;
