const express = require('express');
const userRoutes = require('./user');  // Correctly importing userRoutes
const chatRoutes = require('./chat');  // Correctly importing chatRoutes

const appRouter = express.Router();  // Correctly creating the router instance

// Using the routes under specific paths
appRouter.use("/user", userRoutes);
appRouter.use("/chat", chatRoutes);

module.exports = appRouter;
