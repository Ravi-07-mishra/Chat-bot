// src/helpers/api-communicator.js
import api from "../api";

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const signupUser = async (name, email, password) => {
  const res = await api.post("/user/signup", { name, email, password });
  if (![200, 201].includes(res.status)) {
    throw new Error("Signup failed");
  }
  // Server sets auth_token cookie; no localStorage needed
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await api.post("/user/login", { email, password });
  if (![200, 201].includes(res.status)) {
    throw new Error("Login failed");
  }
  // Server sets auth_token cookie
  return res.data;
};

export const checkAuthStatus = async () => {
  const res = await api.get("/user/auth-status");
  if (res.status !== 200) throw new Error("Not authenticated");
  return res.data.user;
};

// ─── CHATS ────────────────────────────────────────────────────────────────────

export const getConversations = async () => {
  const res = await api.get("/chat/conversations");
  return res.data.conversations;
};

export const getConversationById = async (id) => {
  const res = await api.get(`/chat/conversations/${id}`);
  return res.data.conversation;
};

export const sendChatMessage = async (message, conversationId = null) => {
  const res = await api.post("/chat/new", { message, conversationId });
  return res.data.conversation;
};

// ─── SSE STREAM ───────────────────────────────────────────────────────────────

function parseSSE(buffer, onChunk, onDone) {
  const blocks = buffer.split("\n\n");
  blocks.slice(0, -1).forEach((block) => {
    const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
    if (!dataLine) return;
    const jsonStr = dataLine.replace(/^data:\s*/, "");
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.part) onChunk(parsed.part);
      else if (parsed.text) onDone(parsed.text);
    } catch {
      // ignore non-JSON lines like "event: chunk"
    }
  });
  return blocks[blocks.length - 1]; // leftover
}

export function streamChat({ message, conversationId, onChunk, onDone, onError }) {
  fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    mode: "cors",
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
          buffer = parseSSE(buffer, onChunk, onDone);
          read();
        });
      }

      read();
    })
    .catch(onError);
}

// ─── UPLOAD + SSE ─────────────────────────────────────────────────────────────

export function uploadFile({ file, text = "", conversationId, onChunk, onDone, onError }) {
  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result.split(",")[1];
    fetch(`${import.meta.env.VITE_API_URL}/chat/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({ imageBase64: base64, message: text, conversationId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Upload failed");
        const streamReader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        function read() {
          streamReader.read().then(({ done, value }) => {
            if (done) return onDone(buffer);
            buffer += decoder.decode(value, { stream: true });
            buffer = parseSSE(buffer, onChunk, onDone);
            read();
          });
        }

        read();
      })
      .catch(onError);
  };

  reader.onerror = onError;
  reader.readAsDataURL(file);
}

// ─── MISC ────────────────────────────────────────────────────────────────────

export const deleteConversation = async (id) => {
  const res = await api.delete(`/chat/conversations/${id}`);
  if (res.status !== 200) throw new Error("Deletion failed");
  return res.data;
};

export const getSuggestions = async (prefix) => {
  const res = await api.post("/chat/suggest", { prefix });
  return res.data.suggestions;
};
