// routes/chatRoutes.js
const express = require("express");
const { verifyToken } = require("../utils/token-manager");
const { validate, chatCompletionValidator, streamChatValidator } = require("../utils/validators");
const {
  generateChatCompletion,
  streamChat,
  getConversationsSummary,
  getConversationById,
  handleUpload,         // NEW: your controller for file/image upload
  getSuggestions       // NEW: your controller for smart suggestions
} = require("../controllers/chat");

const chatRoutes = express.Router();

// Classic chat (non-streaming)
chatRoutes.post(
  "/new",
  validate(chatCompletionValidator),
  verifyToken,
  generateChatCompletion
);

// SSE streaming
chatRoutes.post(
  "/stream",
  validate(streamChatValidator),
  verifyToken,
  streamChat
);

// File / Image upload & processing
chatRoutes.post(
  "/upload",
  verifyToken,
  handleUpload
);

// Smart suggestions / autocomplete
chatRoutes.post(
  "/suggest",
  verifyToken,
  getSuggestions
);

// Sidebar listings
chatRoutes.get("/conversations", verifyToken, getConversationsSummary);
chatRoutes.get("/conversations/:conversationId", verifyToken, getConversationById);

module.exports = chatRoutes;
