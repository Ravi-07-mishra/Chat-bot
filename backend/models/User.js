// models/User.js
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    default: randomUUID, // Unique ID for each conversation
  },
  messages: [messageSchema],
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  conversations: [conversationSchema],
});

module.exports = mongoose.model("User", userSchema);
