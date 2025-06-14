// src/services/chatService.js

import api from "../api";  // ← correct relative path into src/api.js

// ------- User auth functions -------

/**
 * Sign up a new user.
 * On success, returns { message, name, email, token } and stores token in localStorage.
 */
export const signupUser = async (name, email, password) => {
  const res = await api.post("/user/signup", { name, email, password });
  if (![200, 201].includes(res.status)) {
    throw new Error("Signup failed");
  }
  // Store JWT for future requests
  localStorage.setItem("bot_token", res.data.token);
  return res.data;
};

/**
 * Login an existing user.
 * On success, returns { message, name, email, token } and stores token in localStorage.
 */
export const loginUser = async (email, password) => {
  const res = await api.post("/user/login", { email, password });
  if (![200, 201].includes(res.status)) {
    throw new Error("Unable to login");
  }
  // Store JWT for future requests
  localStorage.setItem("bot_token", res.data.token);
  return res.data;
};

/**
 * Check current auth status by querying /user/auth-status.
 * Requires Authorization header (set by api interceptor).
 */
export const checkAuthStatus = async () => {
  const res = await api.get("/user/auth-status");
  if (res.status !== 200) {
    throw new Error("Unable to authenticate");
  }
  return res.data;
};

// ------- Chat functions -------

/**
 * Fetch all conversation summaries.
 * GET /api/v1/chat/conversations
 */
export const getConversations = async () => {
  const res = await api.get("/chat/conversations");
  return res.data.conversations;
};

/**
 * Fetch a full conversation by ID.
 * GET /api/v1/chat/conversations/:conversationId
 */
export const getConversationById = async (conversationId) => {
  const res = await api.get(`/chat/conversations/${conversationId}`);
  return res.data.conversation;
};

/**
 * Send a chat message (or start a new conversation).
 * POST /api/v1/chat/new
 */
export const sendChatMessage = async (message, conversationId = null) => {
  const payload = { message };
  if (conversationId) payload.conversationId = conversationId;
  const res = await api.post("/chat/new", payload);
  return res.data.conversation;
};

// ------- SSE streaming / uploads helpers -------

// Helper to do a fetch with the Authorization header
function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("bot_token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

/**
 * SSE streaming chat.
 * POST /api/v1/chat/stream
 */
export function streamChat({ message, conversationId, onChunk, onDone, onError }) {
  fetchWithAuth(`${api.defaults.baseURL}/chat/stream`, {
    method: "POST",
    body: JSON.stringify({ message, conversationId }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Streaming failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      function read() {
        reader.read().then(({ done, value }) => {
          if (done) return onDone(buffer);
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          parts.slice(0, -1).forEach((block) => {
            const line = block.split("\n").find((l) => l.startsWith("data: "));
            if (line) {
              try {
                const parsed = JSON.parse(line.replace("data: ", ""));
                if (parsed.part) onChunk(parsed.part);
                if (parsed.text) onDone(parsed.text);
              } catch {}
            }
          });
          buffer = parts[parts.length - 1];
          read();
        });
      }
      read();
    })
    .catch(onError);
}

/**
 * File/Image upload + SSE streaming.
 * POST /api/v1/chat/upload
 */
export function uploadFile({ file, text = "", conversationId, onChunk, onDone, onError }) {
  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result.split(",")[1];
    const payload = { imageBase64: base64, message: text, conversationId };

    fetchWithAuth(`${api.defaults.baseURL}/chat/upload`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Upload streaming failed");

        const streamReader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        function read() {
          streamReader.read().then(({ done, value }) => {
            if (done) {
              if (buffer.trim()) onDone(buffer); // fallback final emit
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n\n");

            parts.slice(0, -1).forEach((block) => {
              const lines = block.split("\n");
              const eventLine = lines.find((l) => l.startsWith("event:"));
              const dataLine = lines.find((l) => l.startsWith("data:"));

              if (!dataLine) return;

              const eventType = eventLine?.replace("event:", "").trim() || "message";
              const rawData = dataLine.replace("data:", "").trim();

              try {
                const parsed = JSON.parse(rawData);
                if (eventType === "chunk" && parsed.part) {
                  onChunk(parsed.part);
                } else if (eventType === "done" && parsed.text) {
                  onDone(parsed.text);
                } else if (eventType === "error") {
                  console.error("⚠️ Server-side error:", parsed.error);
                  onError(new Error(parsed.error));
                }
              } catch (err) {
                console.error("❌ Failed to parse SSE block:", err, rawData);
              }
            });

            buffer = parts[parts.length - 1];
            read();
          });
        }

        read();
      })
      .catch(onError);
  };

  reader.onerror = onError;
  reader.readAsDataURL(file);
};

/**
+ * Delete a conversation by ID.
+ * DELETE /api/v1/chat/conversations/:conversationId
+ */
export const deleteConversation = async (conversationId) => {
  const res = await api.delete(`/chat/conversations/${conversationId}`);
  if (res.status !== 200) {
    throw new Error("Failed to delete conversation");
  }
 return res.data; // { message: "Deleted" }
};
/**
 * Smart suggestions / autocomplete.
 * POST /api/v1/chat/suggest
 */
export const getSuggestions = async (prefix) => {
  const res = await api.post("/chat/suggest", { prefix });
  return res.data.suggestions;
};
