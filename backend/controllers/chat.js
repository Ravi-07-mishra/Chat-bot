const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the backend instance with your API key
const genAIBackend = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateChatCompletion = async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findById(res.locals.jwtData.id);

    if (!user) {
      return res.status(401).json({ message: "User not registered or token is incorrect." });
    }

    // Convert previous chats to the expected format
    const chats = user.chats.map(({ role, content }) => ({
      role: role === "user" ? "user" : "model",
      parts: [{ text: content }],
    }));

    // Add the current user message
    chats.push({ role: "user", parts: [{ text: message }] });
    user.chats.push({ content: message, role: "user" });

    // Use the correct model identifier here as well
    const model = genAIBackend.getGenerativeModel({ model: "gemini-1.5-pro-002" });
    const result = await model.generateContent({ contents: chats });

    console.log("Full Response:", result);

    if (
      !result.candidates ||
      result.candidates.length === 0 ||
      !result.candidates[0].content ||
      !result.candidates[0].content.parts ||
      result.candidates[0].content.parts.length === 0
    ) {
      throw new Error("No response from the model");
    }

    const botMessage = result.candidates[0].content.parts[0].text;
    user.chats.push({ content: botMessage, role: "assistant" });

    await user.save();
    return res.status(200).json({ chats: user.chats });
  } catch (error) {
    console.error("Error in generateChatCompletion:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = { generateChatCompletion };
