const fs = require('fs');
const User = require('../models/User');
const { randomUUID } = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Helper to pause
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry wrapper
async function generateWithRetry(model, payload, retries = 3, backoff = 1000) {
  try {
    return await model.generateContent(payload);
  } catch (err) {
    if ((err.status === 503 || err.status === 429) && retries > 0) {
      const delay = (err.retryInfo?.retryDelay || backoff) * 1000;
      await sleep(delay);
      return generateWithRetry(model, payload, retries - 1, backoff * 2);
    }
    throw err;
  }
}

// Transform Google search results into Gemini-friendly format
function transformToGeminiFormat(data) {
  return data.map(item => ({
    role: "system",
    parts: [{ text: `${item.title}: ${item.snippet}\nLink: ${item.link}` }]
  }));
}

// Format live data as rich text
function formatLiveData(query, data) {
  if (!data || data.length === 0) return 'No results found.';
  
  return data.map(item => {
    const parts = item.parts[0].text.split('\n');
    const title = parts[0].replace(': ', '');
    const snippet = parts.slice(1, -1).join('\n');
    const link = parts[parts.length - 1].replace('Link: ', '');
    
    return `<div style="margin-bottom:15px;padding-left:10px;border-left:3px solid #26a69a;">
      <a href="${link}" target="_blank" style="color:#26a69a;font-weight:bold;text-decoration:none;">
        ${title}
      </a>
      <p style="color:#e0e0e0;margin-top:5px;">${snippet}</p>
    </div>`;
  }).join('');
}

// Fetch live data from Google (with improved error handling)
async function fetchLiveData(query) {
  try {
    if (!process.env.GOOGLE_API_KEY || !process.env.CUSTOM_SEARCH_ENGINE_ID) {
      throw new Error('API configuration missing');
    }

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.CUSTOM_SEARCH_ENGINE_ID,
        q: query,
        num: 5
      },
      timeout: 5000
    });

    if (!response.data?.items || !Array.isArray(response.data.items)) {
      console.warn('No items array in response');
      return [];
    }

    return response.data.items;
  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
}

// Main chat completion function
async function generateChatCompletion(req, res) {
  try {
    const { message, conversationId } = req.body;
    const userMessage = message?.trim();
    if (!userMessage) {
      return res.status(400).json({ message: 'Message required' });
    }

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Create or load conversation
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

    // Add user message to conversation
    conv.messages.push({ role: 'user', content: userMessage });

    // Handle live data queries
    let liveData = [];
    const queryTriggers = {
      weather: ['weather', 'forecast'],
      news: ['news', 'headlines'],
      sports: ['sports', 'score', 'game', 'match']
    };

    for (const [category, triggers] of Object.entries(queryTriggers)) {
      if (triggers.some(trigger => userMessage.toLowerCase().includes(trigger))) {
        liveData = await fetchLiveData(userMessage);
        break;
      }
    }

    // If live data found, create assistant message
    if (liveData.length > 0) {
      const formattedData = formatLiveData(userMessage, liveData);
      
      // Add live data as assistant message
      conv.messages.push({
        role: 'assistant',
        content: `🔍 Live results for "${userMessage}":\n${formattedData}`
      });

      await user.save();
      return res.json({ conversation: conv });
    }

    // Summarize if needed
    if (conv.messages.length > 20) {
      const old = conv.messages.splice(0, 10);
      const summary = await summarizeMessages(old);
      conv.summary = (conv.summary || '') + '\n' + summary;
    }

    // Generate AI response
    const contents = [];
    if (conv.summary) {
      contents.push({
        role: 'system',
        parts: [{ text: `Summary:\n${conv.summary}` }],
      });
    }
    
    conv.messages.forEach(m => 
      contents.push({ role: m.role, parts: [{ text: m.content }] })
    );

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await generateWithRetry(model, {
      contents,
      tool_config: { function_calling_config: { mode: 'AUTO' } },
    });

    const candidate = result.response.candidates[0];
    const botText = candidate.content?.parts?.[0]?.text || '';

    // Add AI response
    conv.messages.push({ role: 'assistant', content: botText });
    await user.save();

    return res.json({ conversation: conv });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ message: err.message || 'Internal error' });
  }
}

// SSE streaming function
async function streamChat(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  try {
    const { message, conversationId } = req.body;
    const userMessage = message?.trim();
    
    if (!userMessage) {
      res.write(`event: error\ndata:${JSON.stringify({error: 'Message required'})}\n\n`);
      return res.end();
    }

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.write(`event: error\ndata:${JSON.stringify({error: 'Invalid user'})}\n\n`);
      return res.end();
    }

    // Create or load conversation
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
    conv.messages.push({ role: 'user', content: userMessage });
    await user.save();

    // Handle live data queries
    let liveData = [];
    const queryTriggers = {
      weather: ['weather', 'forecast'],
      news: ['news', 'headlines'],
      sports: ['sports', 'score', 'game', 'match']
    };

    for (const [category, triggers] of Object.entries(queryTriggers)) {
      if (triggers.some(trigger => userMessage.toLowerCase().includes(trigger))) {
        liveData = await fetchLiveData(userMessage);
        break;
      }
    }

    // If live data found, send as assistant message
    if (liveData.length > 0) {
      const formattedData = formatLiveData(userMessage, liveData);
      const liveMessage = `🔍 Live results for "${userMessage}":\n${formattedData}`;
      
      // Add to conversation
      conv.messages.push({ role: 'assistant', content: liveMessage });
      await user.save();

      // Send as SSE event
      res.write(`event: chunk\ndata:${JSON.stringify({ part: liveMessage })}\n\n`);
      res.write(`event: done\ndata:${JSON.stringify({
        text: liveMessage,
        conversationId: conv.conversationId
      })}\n\n`);
      return res.end();
    }

    // Generate AI response
    const contents = [];
    if (conv.summary) {
      contents.push({
        role: 'system',
        parts: [{ text: `Summary:\n${conv.summary}` }],
      });
    }
    
    conv.messages.forEach(m => 
      contents.push({ role: m.role, parts: [{ text: m.content }] })
    );

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const stream = await model.generateContentStream({ contents });

    let buffer = '';
    for await (const chunk of stream.stream) {
      const part = chunk.text();
      buffer += part;
      res.write(`event: chunk\ndata:${JSON.stringify({ part })}\n\n`);
    }

    // Add final response to conversation
    const finalText = buffer.trim();
    conv.messages.push({ role: 'assistant', content: finalText });
    await user.save();

    res.write(`event: done\ndata:${JSON.stringify({
      text: finalText,
      conversationId: conv.conversationId
    })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    res.write(`event: error\ndata:${JSON.stringify({
      error: err.message || 'Stream failed'
    })}\n\n`);
    res.end();
  }
}

// ─── FILE / IMAGE UPLOAD (SSE) ─────────────────────────────────────────────────
async function handleUpload(req, res) {
  let mimeType, imageBase64;

  if (req.file) {
    mimeType = req.file.mimetype;
    imageBase64 = fs.readFileSync(req.file.path, { encoding: "base64" });
  } else if (req.body.imageBase64) {
    imageBase64 = req.body.imageBase64;
    mimeType = req.body.mimeType || "image/jpeg";
  } else {
    return res.status(400).json({ message: "Image (file or base64) required" });
  }

  const userMessage = (req.body.message || "Please describe this image.").trim();

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.write(
        `event: error\ndata:${JSON.stringify({
          error: "Invalid user",
        })}\n\n`
      );
      return res.end();
    }

    let conv = req.body.conversationId
      ? user.conversations.find(
          (c) => c.conversationId === req.body.conversationId
        )
      : null;
    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: "",
      });
      user.conversations.push(conv);
    }

    conv.messages.push({ role: "user", content: userMessage });
    await user.save();

    const contents = [
      ...(conv.summary
        ? [{ role: "system", parts: [{ text: `Summary:\n${conv.summary}` }] }]
        : []),
      ...conv.messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ];

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const stream = await model.generateContentStream({ contents });

    let buffer = "";
    for await (const chunk of stream.stream) {
      const part = chunk.text() || "";
      buffer += part;
      res.write(`event: chunk\ndata:${JSON.stringify({ part })}\n\n`);
    }

    const finalText = buffer.trim();
    conv.messages.push({ role: "assistant", content: finalText });
    await user.save();

    res.write(
      `event: done\ndata:${JSON.stringify({
        text: finalText,
        conversationId: conv.conversationId,
      })}\n\n`
    );
    res.end();
  } catch (err) {
    console.error("handleUpload error:", err);
    res.write(
      `event: error\ndata:${JSON.stringify({ error: err.message })}\n\n`
    );
    res.end();
  }
}

// ─── DELETE CONVERSATION ───────────────────────────────────────────────────
async function deleteConversation(req, res) {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: "Invalid user" });

    const convId = req.params.conversationId;
    const beforeCount = user.conversations.length;
    user.conversations = user.conversations.filter(
      (c) => c.conversationId !== convId
    );

    if (user.conversations.length === beforeCount) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await user.save();
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteConversation error:", err);
    return res.status(500).json({ message: err.message || "Internal error" });
  }
}

// ─── SMART SUGGESTIONS ──────────────────────────────────────────────────────
async function getSuggestions(req, res) {
  const { prefix } = req.body;
  if (!prefix || prefix.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.3, maxOutputTokens: 60 },
    });
    const prompt = `Suggest 5 completions for: "${prefix}" (JSON array only)`;
    const result = await generateWithRetry(model, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text = result.response.candidates[0].content.parts[0].text || "";
    text = text.replace(/^```json\s*|\s*```$/g, "").trim();
    text = text.replace(/,\s*]$/, "]");

    let suggestions = [];
    try {
      suggestions = JSON.parse(text);
    } catch {
      const m = text.match(/\[(.*)\]/s);
      if (m) {
        suggestions = m[1]
          .split(",")
          .map((s) => s.replace(/^["']|["']$/g, "").trim())
          .filter(Boolean);
      }
    }

    return res.json({ suggestions });
  } catch (err) {
    console.warn("getSuggestions error:", err);
    return res.json({ suggestions: [] });
  }
}
async function getConversationsSummary(req, res) {
  const user = await User.findById(res.locals.jwtData.id);
  if (!user) return res.status(401).json({ message: "Invalid user" });

  const conversations = user.conversations.map((c) => ({
    conversationId: c.conversationId,
    lastMessage: c.messages.slice(-1)[0] || null,
    summary: c.summary || "",
  }));
  return res.json({ conversations });
}

async function getConversationById(req, res) {
  const user = await User.findById(res.locals.jwtData.id);
  if (!user) return res.status(401).json({ message: "Invalid user" });

  const conv = user.conversations.find(
    (c) => c.conversationId === req.params.conversationId
  );
  if (!conv) return res.status(404).json({ message: "Not found" });

  return res.json({ conversation: conv });
}

module.exports = {
  generateChatCompletion,
  streamChat,
  handleUpload,
  getSuggestions,
  getConversationsSummary,
  getConversationById,
  deleteConversation,
};
