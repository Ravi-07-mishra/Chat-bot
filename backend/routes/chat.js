// routes/chatRoutes.js
const express = require("express");
const { verifyToken } = require("../utils/token-manager");
const { validate, chatCompletionValidator } = require("../utils/validators");
const { generateChatCompletion, getConversationsSummary, getConversationById } = require("../controllers/chat");
const chatRoutes = express.Router();

// POST endpoint: Create or update a conversation by sending a new message
chatRoutes.post("/new", validate(chatCompletionValidator), verifyToken, (req, res, next) => {
  console.log("POST /new endpoint called");
  next();
}, generateChatCompletion);

// GET endpoint: Retrieve conversation summaries (for sidebar)
chatRoutes.get("/conversations", verifyToken, (req, res, next) => {
  console.log("GET /conversations endpoint called");
  next();
}, getConversationsSummary);

// GET endpoint: Retrieve full conversation by ID
chatRoutes.get("/conversations/:conversationId", verifyToken, (req, res, next) => {
  console.log("GET /conversations/:conversationId endpoint called");
  next();
}, getConversationById);

module.exports = chatRoutes;
