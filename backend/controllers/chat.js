const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { randomUUID } = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function parseBase64Image(imageBase64) {
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image format');
  }
  return {
    mimeType: matches[1],
    data: matches[2]
  };
}

function buildMessageParts(message) {
  const parts = [];
  
  if (message.content) {
    parts.push({ text: message.content });
  }
  
  if (message.image) {
    try {
      const { mimeType, data } = parseBase64Image(message.image);
      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    } catch (err) {
      console.error('Error parsing image:', err);
    }
  }
  
  return parts;
}

async function summarizeMessages(memories) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = [
    { role: 'user', parts: [{ text: 'Summarize these messages succinctly:' }] },
    ...memories.map((m) => ({ role: m.role, parts: buildMessageParts(m) })),
  ];
  const res = await generateWithRetry(model, { contents: prompt });
  return res.response.candidates[0].content.parts[0].text || 'Unable to summarize.';
}

function transformToGeminiFormat(data) {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    role: 'user',
    parts: [{
      text: `${item.title || 'No title'}: ${item.snippet || 'No description available'}\nLink: ${item.link || '#'}`
    }]
  }));
}

function formatLiveData(query, data) {
  if (!data || data.length === 0) return 'No results found.';

  return data.map(item => {
    let title, snippet, link;
    
    if (item.parts && item.parts[0] && item.parts[0].text) {
      const parts = item.parts[0].text.split('\n');
      title = parts[0].split(':')[0] || 'No title';
      snippet = parts[0].split(':').slice(1).join(':').trim() || 'No description available';
      link = parts.length > 1 ? parts[parts.length - 1].replace('Link: ', '') : '#';
    } else {
      title = item.title || 'No title';
      snippet = item.snippet || 'No description available';
      link = item.link || '#';
    }

    return `${title}\n${snippet}\n${link}`;
  }).join('\n\n');
}

async function fetchLiveData(query) {
  try {
    if (!process.env.GOOGLE_API_KEY || !process.env.CUSTOM_SEARCH_ENGINE_ID) {
      console.warn('Google API configuration missing');
      return [];
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

    if (!response.data?.items) {
      console.warn('No items in Google search response');
      return [];
    }

    return response.data.items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }));
  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
}

async function generateChatCompletion(req, res) {
  try {
    const { message, conversationId, image } = req.body;
    const userMessage = message?.trim();
    const userImage = image;

    if (!userMessage && !userImage) {
      return res.status(400).json({ message: 'Message or image required' });
    }

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    let conv = conversationId
      ? user.conversations.find((c) => c.conversationId === conversationId)
      : null;
    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: '',
      });
      user.conversations.push(conv);
    }

    conv.messages.push({ 
      role: 'user', 
      content: userMessage,
      image: userImage 
    });

    if (userImage) {
      const result = await processImageUpload(userImage, conv, userMessage);
      if (result) {
        await user.save();
        return res.json({ conversation: conv });
      }
    }

    let liveData = [];
    const queryTriggers = {
      weather: ['weather', 'forecast'],
      news: ['news', 'headlines', '2025'],
      sports: ['sports', 'score', 'game', 'match'],
    };

    for (const [category, triggers] of Object.entries(queryTriggers)) {
      if (triggers.some(trigger => userMessage.toLowerCase().includes(trigger))) {
        liveData = await fetchLiveData(userMessage);
        break;
      }
    }

    if (liveData.length > 0) {
      const transformedData = transformToGeminiFormat(liveData);
      const formattedData = formatLiveData(userMessage, transformedData);

      conv.messages.push({
        role: 'assistant',
        content: `I found these results for "${userMessage}":\n${formattedData}`,
      });

      await user.save();
      return res.json({ conversation: conv });
    }

    if (conv.messages.length > 20) {
      const old = conv.messages.splice(0, 10);
      const summary = await summarizeMessages(old);
      conv.summary = (conv.summary || '') + '\n' + summary;
    }

    const contents = [];
    if (conv.summary) {
      contents.push({
        role: 'user',
        parts: [{ text: `Summary:\n${conv.summary}` }],
      });
    }

    conv.messages.forEach(m => {
      contents.push({
        role: m.role,
        parts: buildMessageParts(m)
      });
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await generateWithRetry(model, { contents });

    const candidate = result.response.candidates[0];
    const botText = candidate.content?.parts?.[0]?.text || '';

    conv.messages.push({ role: 'assistant', content: botText });
    await user.save();

    return res.json({ conversation: conv });
  } catch (err) {
    console.error('Chat error:', err);
    const status = err.status === 429 ? 503 : 500;
    return res.status(status).json({ message: err.message || 'Internal error' });
  }
}

async function processImageUpload(imageBase64, conversation, userMessage = '') {
  try {
    const { mimeType, data } = parseBase64Image(imageBase64);
    
    const contents = [
      ...(conversation.summary
        ? [{ role: 'user', parts: [{ text: `Summary:\n${conversation.summary}` }] }]
        : []),
      ...conversation.messages.map(m => ({
        role: m.role,
        parts: buildMessageParts(m)
      })),
      {
        role: 'user',
        parts: [
          ...(userMessage ? [{ text: userMessage }] : []),
          {
            inlineData: {
              mimeType,
              data
            }
          }
        ]
      }
    ];

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({ contents });
    
    const candidate = result.response.candidates[0];
    const botText = candidate.content?.parts?.[0]?.text || '';

    conversation.messages.push({ role: 'assistant', content: botText });
    return true;
  } catch (err) {
    console.error('Image processing error:', err);
    conversation.messages.push({ 
      role: 'assistant', 
      content: 'Sorry, I had trouble processing that image' 
    });
    return true;
  }
}
async function streamChat(req, res) {
  // 1) SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  try {
    const { message, conversationId, image } = req.body;
    const userMessage = message?.trim();
    const userImage = image;

    // 2) Validation
    if (!userMessage && !userImage) {
      res.write(`event: error\ndata:${JSON.stringify({ error: 'Message or image required' })}\n\n`);
      return res.end();
    }

    // 3) Load user & conversation
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.write(`event: error\ndata:${JSON.stringify({ error: 'Invalid user' })}\n\n`);
      return res.end();
    }

    let conv = conversationId
      ? user.conversations.find(c => c.conversationId === conversationId)
      : null;
    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: '',
      });
      user.conversations.push(conv);
    }

    // 4) Persist user message
    conv.messages.push({ role: 'user', content: userMessage, image: userImage });
    await user.save();

    // 5) Image‐only path
    if (userImage) {
      const ok = await processImageUpload(userImage, conv, userMessage);
      if (ok) {
        const last = conv.messages[conv.messages.length - 1].content;
        res.write(`event: chunk\ndata:${JSON.stringify({ part: last })}\n\n`);
        res.write(`event: done\ndata:${JSON.stringify({ text: last, conversationId: conv.conversationId })}\n\n`);
        return res.end();
      }
    }

    // 6) Live‐data trigger
    const triggers = {
      weather: ['weather','forecast'],
      news: ['news','headlines'],
      sports: ['sports','score','match']
    };
    let liveData = [];
    for (const ts of Object.values(triggers)) {
      if (ts.some(t => userMessage.toLowerCase().includes(t))) {
        liveData = await fetchLiveData(userMessage);
        break;
      }
    }
    if (liveData.length) {
      const transformed = transformToGeminiFormat(liveData);
      const liveMsg = `I found these results for "${userMessage}":\n${formatLiveData(userMessage, transformed)}`;
      conv.messages.push({ role: 'assistant', content: liveMsg });
      await user.save();

      res.write(`event: chunk\ndata:${JSON.stringify({ part: liveMsg })}\n\n`);
      res.write(`event: done\ndata:${JSON.stringify({ text: liveMsg, conversationId: conv.conversationId })}\n\n`);
      return res.end();
    }

    // 7) Summarize old messages if too long
    if (conv.messages.length > 20) {
      const old = conv.messages.splice(0, 10);
      const summary = await summarizeMessages(old);
      conv.summary = [conv.summary, summary].filter(Boolean).join('\n');
    }

    // 8) Build contents, mapping roles for Gemini
    const contents = [];
    if (conv.summary) {
      contents.push({
        role: 'user',
        parts: [{ text: `Context from previous chats:\n${conv.summary}` }]
      });
    }
    conv.messages.forEach(m => {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: buildMessageParts(m)
      });
    });

    // 9) Stream from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const stream = await model.generateContentStream({ contents });

    let buffer = '';
    for await (const chunk of stream.stream) {
      const part = chunk.text() || '';
      buffer += part;
      res.write(`event: chunk\ndata:${JSON.stringify({ part })}\n\n`);
    }

    // 10) Finalize
    const finalText = buffer.trim();
    conv.messages.push({ role: 'assistant', content: finalText });
    await user.save();

    res.write(`event: done\ndata:${JSON.stringify({ text: finalText, conversationId: conv.conversationId })}\n\n`);
    res.end();

  } catch (err) {
    console.error('Stream error:', err);
    res.write(`event: error\ndata:${JSON.stringify({ error: err.message || 'Stream failed' })}\n\n`);
    res.end();
  }
}

async function handleUpload(req, res) {
  let imageBase64;

  // 1) Read file or base64
  if (req.file) {
    const mimeType = req.file.mimetype;
    const data = fs.readFileSync(req.file.path, { encoding: 'base64' });
    imageBase64 = `data:${mimeType};base64,${data}`;
    fs.unlinkSync(req.file.path);
  } else if (req.body.image) {
    imageBase64 = req.body.image;
  } else {
    return res.status(400).json({ message: 'Image (file or base64) required' });
  }

  const userMessage = (req.body.message || 'Please describe this image.').trim();

  // 2) Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  try {
    // 3) Load user & conversation
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.write(`event: error\ndata:${JSON.stringify({ error: 'Invalid user' })}\n\n`);
      return res.end();
    }

    let conv = req.body.conversationId
      ? user.conversations.find(c => c.conversationId === req.body.conversationId)
      : null;
    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: '',
      });
      user.conversations.push(conv);
    }

    // 4) Persist the incoming user message + image
    conv.messages.push({
      role: 'user',
      content: userMessage,
      image: imageBase64,
    });
    await user.save();

    // 5) Parse the image
    const { mimeType, data } = parseBase64Image(imageBase64);

    // 6) Summarize old messages if too long
    if (conv.messages.length > 20) {
      const old = conv.messages.splice(0, 10);
      const summary = await summarizeMessages(old);
      conv.summary = [conv.summary, summary].filter(Boolean).join('\n');
    }

    // 7) Build the contents array, mapping roles for Gemini
    const contents = [];
    if (conv.summary) {
      contents.push({
        role: 'user',   // summary as user context
        parts: [{ text: `Context from previous chats:\n${conv.summary}` }],
      });
    }

    conv.messages.forEach(m => {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: buildMessageParts(m),
      });
    });

    // 8) Append the new user-with-image turn
    contents.push({
      role: 'user',
      parts: [
        ...(userMessage ? [{ text: userMessage }] : []),
        { inlineData: { mimeType, data } },
      ],
    });

    // 9) Stream from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const stream = await model.generateContentStream({ contents });

    let buffer = '';
    for await (const chunk of stream.stream) {
      const part = chunk.text() || '';
      buffer += part;
      // send each chunk
      res.write(`event: chunk\ndata:${JSON.stringify({ part })}\n\n`);
      res.flush();
    }

    // 10) Finalize and save
    const finalText = buffer.trim();
    conv.messages.push({ role: 'assistant', content: finalText });
    await user.save();

    // send done
    res.write(`event: done\ndata:${JSON.stringify({
      text: finalText,
      conversationId: conv.conversationId,
    })}\n\n`);
    res.end();

  } catch (err) {
    console.error('handleUpload error:', err);
    res.write(`event: error\ndata:${JSON.stringify({ error: err.message || 'Stream failed' })}\n\n`);
    res.end();
  }
}

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
    title: c.title,
    lastMessage: c.messages.slice(-1)[0] || null,
    summary: c.summary || "",
    updatedAt: c.updatedAt
  })).sort((a, b) => b.updatedAt - a.updatedAt);
  
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