import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI client with env var key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

// Axios default setup to use VITE_API_URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// List available models for debugging
export const listModels = async () => {
  try {
    const models = await genAI.listModels();
    console.log('Available models:');
    models.models.forEach((m) => console.log(`- ${m.name}`));
    return models.models;
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
};

export const signupUser = async (name, email, password) => {
  try {
    const res = await axios.post('/api/v1/user/signup', { name, email, password });
    if (![200, 201].includes(res.status)) throw new Error('Signup failed');
    return res.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/user/login', { email, password });
    if (![200, 201].includes(res.status)) throw new Error('Login failed');
    return res.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const checkAuthStatus = async () => {
  try {
    const res = await axios.get('/api/v1/user/auth-status');
    if (res.status !== 200) throw new Error('Auth status check failed');
    return res.data;
  } catch (error) {
    console.error('Auth status error:', error);
    throw error;
  }
};

export const sendGeminiChatRequest = async (message) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });
    const chatResponse = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });

    const resp = chatResponse.response || chatResponse;
    const candidate = resp.candidates?.[0];
    if (!candidate) throw new Error('No model response');

    const { content } = candidate;
    return content?.parts?.[0]?.text || (typeof candidate.text === 'function' ? candidate.text() : candidate.text);
  } catch (error) {
    console.error('Chat request error:', error);
    throw error;
  }
};