// routes/chatRoutes.js

const express = require("express");
const { verifyToken } = require("../utils/token-manager");
const {
  validate,
  chatCompletionValidator,
  streamChatValidator,
} = require("../utils/validators");
const {
  generateChatCompletion,
  streamChat,
  getConversationsSummary,
  getConversationById,
  handleUpload,
  getSuggestions,
  deleteConversation,
} = require("../controllers/chat");

const chatRoutes = express.Router();

// Classic chat (non‑streaming)
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

// File / Image upload & processing (now JSON Base64, no multer)
chatRoutes.post(
  "/upload",
  verifyToken,
  handleUpload
);

// Smart suggestions / autocomplete
chatRoutes.post("/suggest", verifyToken, getSuggestions);

// Sidebar listings
chatRoutes.get("/conversations", verifyToken, getConversationsSummary);
chatRoutes.get(
  "/conversations/:conversationId",
  verifyToken,
  getConversationById
);
// Delete a conversation
chatRoutes.delete(
  "/conversations/:conversationId",
  verifyToken,
  deleteConversation
);

module.exports = chatRoutes;
