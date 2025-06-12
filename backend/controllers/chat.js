// controllers/chat.js

const User = require("../models/User");
const { randomUUID } = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Sleep helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retry wrapper for rate limits / 503s
async function generateWithRetry(model, payload, retries = 3, backoffMs = 1000) {
  try {
    return await model.generateContent(payload);
  } catch (err) {
    const is503 = err.status === 503;
    const is429 = err.status === 429;
    if ((is503 || is429) && retries > 0) {
      const retryAfter = err.retryInfo?.retryDelay
        ? parseInt(err.retryInfo.retryDelay, 10) * 1000
        : backoffMs;
      console.warn(`Gemini ${err.status} — retrying in ${retryAfter}ms… (${retries} left)`);
      await sleep(retryAfter);
      return generateWithRetry(model, payload, retries - 1, backoffMs * 2);
    }
    throw err;
  }
}

// Split long texts into ~15k-char chunks
function chunkText(text, maxChars = 15000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

// Summarize a batch of messages
async function summarizeMessages(memories) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = [
    { role: "user", parts: [{ text: "Please summarize these messages succinctly:" }] },
    ...memories.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
  ];
  const res = await generateWithRetry(model, { contents: prompt });
  return res.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to summarize.";
}

// -------------------- STANDARD CHAT (non-streaming) --------------------
async function generateChatCompletion(req, res) {
  console.log("✅ generateChatCompletion called");
  try {
    const { message, conversationId } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    let conv = conversationId
      ? user.conversations.id(conversationId)
      : null;

    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: "",
      });
      user.conversations.push(conv);
    }

    conv.messages.push({ role: "user", content: message });

    if (conv.messages.length > 20) {
      const old = conv.messages.splice(0, 10);
      const sum = await summarizeMessages(old);
      conv.summary = (conv.summary || "") + "\n" + sum;
    }

    const contents = [];
    if (conv.summary) {
      contents.push({
        role: "system",
        parts: [{ text: `Summary of earlier chat:\n${conv.summary}` }],
      });
    }

    conv.messages.forEach((m) =>
      contents.push({ role: m.role, parts: [{ text: m.content }] })
    );

    console.log("📤 Sending to Gemini-2.0-Flash:", contents);

    // ✅ Declare tools INSIDE the function
    const tools = [
      {
        function_declarations: [
          {
            name: "getWeather",
            description: "Gets weather",
            parameters: {
              type: "object",
              properties: {
                city: { type: "string" }
              },
              required: ["city"]
            }
          }
        ]
      }
    ];

    const aiModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools
    });

    // ✅ Use tool_config instead of functionCall
    const result = await generateWithRetry(aiModel, {
      contents,
      tool_config: {
        function_calling_config: {
          mode: "AUTO"
        }
      }
    });

    const candidate = result.response.candidates[0];
    let botText = "";

    if (candidate.functionCall) {
      const { name, args } = candidate.functionCall;
      if (name === "getWeather") {
        botText = `Weather in ${args.city}: ${await getWeatherFromAPI(args.city)}`;
      }
    } else {
      botText = candidate.content.parts[0].text;
    }

    conv.messages.push({ role: "assistant", content: botText });
    await user.save();

    return res.json({ conversation: conv });
  } catch (err) {
    console.error("🔥 generateChatCompletion error:", err);
    if (err.status === 429) return res.status(503).json({ message: "Rate limit exceeded." });
    return res.status(500).json({ message: err.message || "Internal error" });
  }
}


// -------------------- SSE STREAMING CHAT --------------------
async function streamChat(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");

  try {
    const { message, imageBase64, conversationId } = req.body;
    if (!message && !imageBase64) {
      res.write(`event: error\ndata:${JSON.stringify({ error: "Message or image required" })}\n\n`);
      return res.end();
    }

    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      res.write(`event: error\ndata:${JSON.stringify({ error: "Invalid user" })}\n\n`);
      return res.end();
    }

    let conv = conversationId
      ? user.conversations.id(conversationId)
      : null;

    if (!conv) {
      conv = user.conversations.create({
        conversationId: randomUUID(),
        messages: [],
        summary: "",
      });
      user.conversations.push(conv);
    }

    const contents = [];
    if (conv.summary) {
      contents.push({
        role: "system",
        parts: [{ text: `Summary of earlier chat:\n${conv.summary}` }],
      });
    }

    if (imageBase64) {
      contents.push(
        { role: "user", parts: [{ text: "Please analyze this image:" }] },
        { role: "user", parts: [{ inlineData: { mimeType: "image/png", data: imageBase64 } }] }
      );
      conv.messages.push({ role: "user", content: "[Image]" });
    }

    if (message) {
      chunkText(message).forEach((c) => contents.push({ role: "user", parts: [{ text: c }] }));
      conv.messages.push({ role: "user", content: message });
    }

    await user.save();

    conv.messages.forEach((m) => contents.push({ role: m.role, parts: [{ text: m.content }] }));

    const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const stream = await aiModel.generateContentStream({ contents });

    let buffer = "";
    for await (const chunk of stream.stream) {
      const part = chunk.text() || "";
      buffer += part;
      res.write(`event: chunk\ndata: ${JSON.stringify({ part })}\n\n`);
    }

    const finalText = buffer.trim();
    conv.messages.push({ role: "assistant", content: finalText });
    await user.save();

    res.write(`event: done\ndata: ${JSON.stringify({ text: finalText, conversationId: conv.conversationId })}\n\n`);
    res.end();
  } catch (err) {
    console.error("🔥 streamChat error:", err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

// -------------------- FILE / IMAGE UPLOAD --------------------
async function handleUpload(req, res) {
  try {
    const { imageBase64, message, conversationId } = req.body;
    // Reuse your streaming logic under the hood
    req.body = { imageBase64, message, conversationId };
    await streamChat(req, res);
  } catch (err) {
    console.error("🔥 handleUpload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
}

// -------------------- SUGGESTIONS / AUTOCOMPLETE --------------------
async function getSuggestions(req, res) {
  try {
    const { prefix } = req.body;
    // Simple mock suggestions—replace with your own logic or model call
    const samples = [
      "What is AI?",
      "How does machine learning work?",
      "Explain quantum computing",
      "Translate this to Spanish",
    ];
    const suggestions = samples.filter((s) =>
      s.toLowerCase().includes(prefix?.toLowerCase() || "")
    );
    res.json({ suggestions });
  } catch (err) {
    console.error("🔥 getSuggestions error:", err);
    res.status(500).json({ message: "Suggestions failed", error: err.message });
  }
}

// -------------------- SUMMARY & RETRIEVE --------------------
async function getConversationsSummary(req, res) {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: "Invalid user" });
    const conversations = user.conversations.map((c) => ({
      conversationId: c.conversationId,
      lastMessage: c.messages.slice(-1)[0] || null,
      summary: c.summary || "",
    }));
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch summaries." });
  }
}

async function getConversationById(req, res) {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).json({ message: "Invalid user" });
    const conv = user.conversations.find((c) => c.conversationId === req.params.conversationId);
    if (!conv) return res.status(404).json({ message: "Not found" });
    res.json({ conversation: conv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch conversation." });
  }
}

// Stub for function-calling example
async function getWeatherFromAPI(city) {
  return "Sunny, 28°C";
}

// Export all handlers
module.exports = {
  generateChatCompletion,
  streamChat,
  handleUpload,
  getSuggestions,
  getConversationsSummary,
  getConversationById,
};
