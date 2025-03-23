// controllers/chat.js
const User = require("../models/User");
const { randomUUID } = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the backend instance with your API key
const genAIBackend = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateChatCompletion = async (req, res) => {
  console.log("generateChatCompletion called");
  try {
    const { message, conversationId } = req.body;
    console.log("Received message:", message);
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Retrieve the user document
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token is incorrect." });
    }
    console.log("User found:", user.email);

    // Find or create a conversation
    let conversation;
    if (conversationId) {
      conversation = user.conversations.find(
        (conv) => conv.conversationId === conversationId
      );
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
    } else {
      // Create new conversation
      conversation = { conversationId: randomUUID(), messages: [] };
      user.conversations.push(conversation);
    }

    // Append the current user message to the conversation
    conversation.messages.push({ role: "user", content: message });
    console.log("Conversation messages so far:", conversation.messages);

    // Prepare the conversation messages for the AI model
    const chatsForModel = conversation.messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
    console.log("Chats for model:", chatsForModel);

    // Call the AI model
    const model = genAIBackend.getGenerativeModel({ model: "gemini-1.5-pro-002" });
    const result = await model.generateContent({ contents: chatsForModel });
    console.log("Full AI Response:", result);

    // Check for response candidates under result.response
    const candidates = result.response?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from the model");
    }
    const candidateContent = candidates[0].content;
    if (!candidateContent || !candidateContent.parts || candidateContent.parts.length === 0) {
      throw new Error("No response content from the model");
    }
    const botMessage = candidateContent.parts[0].text;
    console.log("Bot message:", botMessage);

    // Append bot message to conversation
    conversation.messages.push({ role: "assistant", content: botMessage });

    // Save updated user document
    await user.save();
    console.log("Conversation after update:", conversation.messages);

    // Return the conversation (with conversationId)
    return res.status(200).json({ conversation });
  } catch (error) {
    console.error("Error in generateChatCompletion:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const getConversationsSummary = async (req, res) => {
  console.log("getConversationsSummary called");
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token is incorrect." });
    }
    // Return a summary for each conversation: conversationId and last message
    const summaries = user.conversations.map((conv) => ({
      conversationId: conv.conversationId,
      lastMessage:
        conv.messages && conv.messages.length > 0
          ? conv.messages[conv.messages.length - 1]
          : null,
    }));
    console.log("Conversation summaries:", summaries);
    return res.status(200).json({ conversations: summaries });
  } catch (error) {
    console.error("Error retrieving conversation summaries:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const getConversationById = async (req, res) => {
  console.log("getConversationById called");
  try {
    const { conversationId } = req.params;
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token is incorrect." });
    }
    const conversation = user.conversations.find(
      (conv) => conv.conversationId === conversationId
    );
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    return res.status(200).json({ conversation });
  } catch (error) {
    console.error("Error retrieving conversation:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = { generateChatCompletion, getConversationsSummary, getConversationById };
