const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAIBackend = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const configureGenAI = () => {
  return genAIBackend;
};

module.exports = { configureGenAI };
