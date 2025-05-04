const User = require("../models/User");
const { randomUUID } = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the backend instance with your API key
const genAIBackend = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateChatCompletion = async (req, res) => {
  console.log("✅ generateChatCompletion called");

  try {
    const { message, conversationId } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: "User not registered" });

    // find or create conversation
    let conv = conversationId
      ? user.conversations.find(c => c.conversationId === conversationId)
      : null;

    if (!conv) {
      conv = { conversationId: randomUUID(), messages: [] };
      user.conversations.push(conv);
    }

    // Push user message
    conv.messages.push({ role: "user", content: message });

    // Convert conversation to Gemini format
    const chatsForModel = conv.messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    console.log("📤 chatsForModel:", JSON.stringify(chatsForModel, null, 2));

    // Generate response from Gemini
    let botMessage;
    try {
      const model = genAIBackend.getGenerativeModel({ model: "gemini-1.5-pro" }); // Prefer this over -002 unless you need bleeding-edge
      const result = await model.generateContent({
        contents: chatsForModel,
      });

      const response = result.response;
      console.log("✅ Gemini response received");

      const candidate = response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidate) throw new Error("No valid candidate from Gemini API");
      botMessage = candidate;

    } catch (aiErr) {
      console.error("❌ Gemini API error:", aiErr);
      return res.status(502).json({ message: `AI error: ${aiErr.message}` });
    }

    // Push assistant message and save
    conv.messages.push({ role: "assistant", content: botMessage });
    await user.save();

    return res.status(200).json({ conversation: conv });

  } catch (err) {
    console.error("🔥 generateChatCompletion error:", err);
    return res.status(500).json({ message: `Internal error: ${err.message}` });
  }
};


const getConversationsSummary = async (req, res) => {
  console.log("🧾 getConversationsSummary called");
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).json({ message: "User not registered or token is incorrect." });
    }

    const summaries = user.conversations.map(conv => ({
      conversationId: conv.conversationId,
      lastMessage: conv.messages.length > 0 ? conv.messages.at(-1) : null,
    }));

    return res.status(200).json({ conversations: summaries });
  } catch (error) {
    console.error("❌ getConversationsSummary error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};


const getConversationById = async (req, res) => {
  console.log("🔍 getConversationById called");
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
    console.error("❌ getConversationById error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = {
  generateChatCompletion,
  getConversationsSummary,
  getConversationById,
};
