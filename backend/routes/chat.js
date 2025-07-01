const express = require("express");
const { verifyToken } = require("../utils/token-manager");
const {
  validate,
  chatCompletionValidator,
  streamChatValidator,
  uploadValidator
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
  "/",
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
  validate(uploadValidator),
  verifyToken,
  handleUpload
);

// Smart suggestions / autocomplete
chatRoutes.post("/suggest", verifyToken, getSuggestions);

// Conversation management
chatRoutes.get("/conversations", verifyToken, getConversationsSummary);
chatRoutes.get("/conversations/:conversationId", verifyToken, getConversationById);
chatRoutes.delete("/conversations/:conversationId", verifyToken, deleteConversation);

module.exports = chatRoutes;