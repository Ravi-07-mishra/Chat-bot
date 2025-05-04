import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with your API key from environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

// List models for debugging purposes (using the correct model ID)
const listModels = async () => {
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    models.models.forEach((model) => {
      console.log(`- ${model.name}`);
    });
  } catch (error) {
    console.error("Error while listing models:", error);
  }
};

listModels();

// Existing signup, login, and auth functions remain unchanged.
export const signupUser = async (name, email, password) => {
  try {
    console.log({ name, email, password });
    const res = await axios.post("/user/signup", { name, email, password });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error("Signup failed");
    }
    return res.data;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post("/user/login", { email, password });
    if (res.status !== 200 && res.status!= 201) {
      throw new Error("Unable to login");
    }
    return res.data;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

export const checkAuthStatus = async () => {
  try {
    const res = await axios.get("/user/auth-status", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("bot_token")}`,
      },
    });
    if (res.status !== 200) {
      throw new Error("Unable to authenticate");
    }
    return res.data;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

// Corrected chat request function using the updated model ID
export const sendGeminiChatRequest = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

    const chatResponse = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
    });

    console.log("Full Response:", chatResponse);
    
    // Use chatResponse.response if available, otherwise use chatResponse directly.
    const responseData = chatResponse.response || chatResponse;
    const candidate = responseData.candidates && responseData.candidates[0];

    if (!candidate) {
      throw new Error("No candidates in the response");
    }

    let botMessage = "";
    if (
      candidate.content &&
      candidate.content.parts &&
      candidate.content.parts.length > 0
    ) {
      botMessage = candidate.content.parts[0].text;
    } else if (candidate.text && typeof candidate.text === "function") {
      botMessage = candidate.text();
    } else if (candidate.text && typeof candidate.text === "string") {
      botMessage = candidate.text;
    } else {
      throw new Error("No valid response from the model");
    }

    return botMessage;
  } catch (error) {
    console.error("Error in sendGeminiChatRequest:", error);
    throw error;
  }
};
