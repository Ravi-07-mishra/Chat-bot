const express = require('express');

const { verifyToken } = require('../utils/token-manager');
const { validate, chatCompletionValidator } = require('../utils/validators');
const { generateChatCompletion } = require('../controllers/chat');
const chatRoutes = express.Router();  // Directly create the Router instance
chatRoutes.post("/new",validate(chatCompletionValidator),verifyToken,generateChatCompletion);
module.exports = chatRoutes;
