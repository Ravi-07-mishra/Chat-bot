import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
const listModels = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log("Model initialized:", model);
  } catch (error) {
    console.error("Error while listing models:", error);
  }
};

listModels();


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

    if (res.status !== 200) {
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
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
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
export const sendGeminiChatRequest = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Use "gemini-pro"
    const chatResponse = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
    });

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
    return botMessage;
  } catch (error) {
    console.error("Error in sendGeminiChatRequest:", error);
    throw error;
  }
};