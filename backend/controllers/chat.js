const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAIBackend = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateChatCompletion = async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findById(res.locals.jwtData.id);

    if (!user) {
      return res.status(401).json({ message: "User not registered or token is incorrect." });
    }

    const chats = user.chats.map(({ role, content }) => ({
      role: role === "user" ? "user" : "model",
      parts: [{ text: content }],
    }));
    chats.push({ role: "user", parts: [{ text: message }] });
    user.chats.push({ content: message, role: "user" });

    const model = genAIBackend.getGenerativeModel({ model: "gemini-1.5-pro" }); // Use "gemini-pro"
    const chatResponse = await model.generateContent({ contents: chats });

    console.log("Full Response:", chatResponse); // Log the full response

    if (
      !chatResponse.candidates ||
      chatResponse.candidates.length === 0 ||
      !chatResponse.candidates[0].content ||
      !chatResponse.candidates[0].content.parts ||
      chatResponse.candidates[0].content.parts.length === 0
    ) {
      throw new Error("No response from the model");
    }

    const botMessage = chatResponse.candidates[0].content.parts[0].text;
    user.chats.push({ content: botMessage, role: "assistant" });
    await user.save();

    return res.status(200).json({ chats: user.chats });
  } catch (error) {
    console.error("Error in generateChatCompletion:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

module.exports = { generateChatCompletion };
