const User = require("../models/User");
const { configureOpenAi } = require('../config/openai-config');
const { OpenAIApi } = require('openai');

const generateChatCompletion = async (req, res, next) => {
    try {
        const { message } = req.body;

        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).json({
                message: "User not registered or token is incorrect."
            });
        }

        const chats = user.chats.map(({ role, content }) => ({ role, content }));
        chats.push({ content: message, role: "user" });
        user.chats.push({ content: message, role: "user" });

        const config = configureOpenAi();
        const openai = new OpenAIApi(config);

        const chatResponse = await openai.createChatCompletion({
            model: "gpt-4",
            messages: chats,
        });

        const botMessage = chatResponse.data.choices[0].message.content;
        user.chats.push({ content: botMessage, role: "assistant" });

        await user.save();

        return res.status(200).json({ chats: user.chats });

    } catch (error) {
        console.error("Error in generateChatCompletion:", error);
        return res.status(500).json({ message: "Something went wrong." });
    }
}
module.exports = {generateChatCompletion}