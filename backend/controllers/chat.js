// controllers/chat.js
const fs = require('fs');
const { randomUUID } = require('crypto');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Retry wrapper for Gemini calls to handle 429/503 with exponential backoff.
 */
async function generateWithRetry(model, payload, retries = 3, backoff = 1000) {
  try {
    return await model.generateContent(payload);
  } catch (err) {
    if ((err.status === 429 || err.status === 503) && retries > 0) {
      const delay = (err.retryInfo?.retryDelay || backoff) * 1000;
      await sleep(delay);
      return generateWithRetry(model, payload, retries - 1, backoff * 2);
    }
    throw err;
  }
}

/**
 * Parse a base64‐encoded data URI into its mimeType and raw data.
 */
function parseBase64Image(imageBase64) {
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 image');
  return { mimeType: matches[1], data: matches[2] };
}

/**
 * Build Gemini message parts from our message schema.
 */
function buildMessageParts(message) {
  const parts = [];
  if (message.content) {
    parts.push({ text: message.content });
  }
  if (message.image) {
    const { mimeType, data } = parseBase64Image(message.image);
    parts.push({ inlineData: { mimeType, data } });
  }
  return parts;
}

/**
 * Classic (non‐stream) chat completion endpoint.
 */
async function generateChatCompletion(req, res) {
  try {
    const { message, conversationId, image } = req.body;
    if (!message?.trim() && !image) {
      return res.status(400).json({ message: 'Message or image required' });
    }

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Find or create the conversation subdocument
    let conv = conversationId
      ? user.conversations.id(conversationId)
      : null;
    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: '',
      });
      user.conversations.push(conv);
    }

    // Add user message
    conv.messages.push({ role: 'user', content: message, image });
    await user.save();  // Persist immediately

    // (Optional) Summarize old messages if exceeding length...
    // ──────────────────────────────────────────────────────────────

    // Build prompt list
    const contents = [
      ...(conv.summary
        ? [{ role: 'system', parts: [{ text: `Summary:\n${conv.summary}` }] }]
        : []),
      ...conv.messages.map(m => ({ role: m.role, parts: buildMessageParts(m) })),
    ];

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await generateWithRetry(model, { contents });
    const botText = result.response.candidates[0].content.parts[0].text;

    // Save assistant's reply
    conv.messages.push({ role: 'assistant', content: botText });
    await user.save();

    return res.json({ conversation: conv });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * SSE‐based streaming chat endpoint.
 */
async function streamChat(req, res) {
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  try {
    const { message, conversationId, image } = req.body;
    if (!message?.trim() && !image) {
      res.write(`event: error\ndata:${JSON.stringify({ error: 'Message or image required' })}\n\n`);
      return res.end();
    }

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.write(`event: error\ndata:${JSON.stringify({ error: 'User not found' })}\n\n`);
      return res.end();
    }

    // Find or create conversation
    let conv = conversationId
      ? user.conversations.id(conversationId)
      : null;
    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: '',
      });
      user.conversations.push(conv);
    }

    // Push user message
    conv.messages.push({ role: 'user', content: message, image });
    await user.save();

    // Build prompt parts
    const contents = [
      ...(conv.summary
        ? [{ role: 'system', parts: [{ text: `Summary:\n${conv.summary}` }] }]
        : []),
      ...conv.messages.map(m => ({ role: m.role, parts: buildMessageParts(m) })),
    ];

    // Stream from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const stream = await model.generateContentStream({ contents });

    let buffer = '';
    for await (const chunk of stream.stream) {
      const part = chunk.text() || '';
      buffer += part;
      res.write(`event: chunk\ndata:${JSON.stringify({ part })}\n\n`);
    }
    const finalText = buffer.trim();

    // Save assistant reply
    conv.messages.push({ role: 'assistant', content: finalText });
    await user.save();

    // Signal done
    res.write(`event: done\ndata:${JSON.stringify({
      text: finalText,
      conversationId: conv.conversationId
    })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Stream error:', err);
    res.write(`event: error\ndata:${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

/**
 * SSE‐based image upload & processing endpoint.
 */
async function handleUpload(req, res) {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  try {
    // Accept either multer‐parsed file or base64 JSON
    const imageBase64 = req.file
      ? (() => {
          const data = fs.readFileSync(req.file.path, 'base64');
          fs.unlinkSync(req.file.path);
          return `data:${req.file.mimetype};base64,${data}`;
        })()
      : req.body.image || req.body.imageBase64;

    if (!imageBase64) {
      res.write(`event: error\ndata:${JSON.stringify({ error: 'Image required' })}\n\n`);
      return res.end();
    }
    const userMessage = (req.body.text || '').trim();

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.write(`event: error\ndata:${JSON.stringify({ error: 'User not found' })}\n\n`);
      return res.end();
    }

    // Find or create conversation
    let conv = req.body.conversationId
      ? user.conversations.id(req.body.conversationId)
      : null;
    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: '',
      });
      user.conversations.push(conv);
    }

    // Save user message + inline image
    conv.messages.push({ role: 'user', content: userMessage, image: imageBase64 });
    await user.save();

    // Build prompt with inline image
    const { mimeType, data } = parseBase64Image(imageBase64);
    const contents = [
      ...(conv.summary
        ? [{ role: 'system', parts: [{ text: `Summary:\n${conv.summary}` }] }]
        : []),
      ...conv.messages.map(m => ({ role: m.role, parts: buildMessageParts(m) })),
    ];

    // Stream from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const stream = await model.generateContentStream({ contents });

    let buffer = '';
    for await (const chunk of stream.stream) {
      const part = chunk.text() || '';
      buffer += part;
      res.write(`event: chunk\ndata:${JSON.stringify({ part })}\n\n`);
    }
    const finalText = buffer.trim();

    // Save assistant reply
    conv.messages.push({ role: 'assistant', content: finalText });
    await user.save();

    // Done event
    res.write(`event: done\ndata:${JSON.stringify({
      text: finalText,
      conversationId: conv.conversationId
    })}\n\n`);
    res.end();

  } catch (err) {
    console.error('handleUpload error:', err);
    res.write(`event: error\ndata:${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

/**
 * Conversation listing, detail, delete, and suggestions follow…
 */
async function getConversationsSummary(req, res) {
  const user = await User.findById(res.locals.jwtData.id);
  if (!user) return res.status(401).json({ message: 'Invalid user' });

  const summary = user.conversations
    .map(c => ({
      conversationId: c.conversationId,
      title: c.title,
      lastMessage: c.messages.slice(-1)[0] || null,
      summary: c.summary,
      updatedAt: c.updatedAt,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  res.json({ conversations: summary });
}

async function getConversationById(req, res) {
  const user = await User.findById(res.locals.jwtData.id);
  if (!user) return res.status(401).json({ message: 'Invalid user' });

  const conv = user.conversations.find(c => c.conversationId === req.params.conversationId);
  if (!conv) return res.status(404).json({ message: 'Not found' });
  res.json({ conversation: conv });
}

async function deleteConversation(req, res) {
  const user = await User.findById(res.locals.jwtData.id);
  if (!user) return res.status(401).json({ message: 'Invalid user' });

  const before = user.conversations.length;
  user.conversations = user.conversations.filter(
    c => c.conversationId !== req.params.conversationId
  );
  if (user.conversations.length === before) {
    return res.status(404).json({ message: 'Conversation not found' });
  }
  await user.save();
  res.json({ message: 'Deleted' });
}

async function getSuggestions(req, res) {
  const { prefix } = req.body;
  if (!prefix || prefix.length < 2) return res.json({ suggestions: [] });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.3, maxOutputTokens: 60 },
    });
    const prompt = `Suggest 5 completions for: "${prefix}" (JSON array only)`;
    const result = await generateWithRetry(model, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    let text = result.response.candidates[0].content.parts[0].text || '';
    text = text.replace(/^```json\s*|\s*```$/g, '').trim().replace(/,\s*]$/, ']');
    const suggestions = JSON.parse(text);
    return res.json({ suggestions });
  } catch (err) {
    console.warn('getSuggestions error:', err);
    return res.json({ suggestions: [] });
  }
}

module.exports = {
  generateChatCompletion,
  streamChat,
  handleUpload,
  getConversationsSummary,
  getConversationById,
  deleteConversation,
  getSuggestions,
};
