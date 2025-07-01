import api from "./api";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const signupUser = async (name, email, password) => {
  try {
    const res = await api.post("/auth/register", { name, email, password });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Signup failed");
  }
};

export const loginUser = async (email, password) => {
  try {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Login failed");
  }
};

export const checkAuthStatus = async () => {
  try {
    const res = await api.get("/auth/verify");
    return res.data.user;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error(err.response?.data?.message || "Authentication check failed");
  }
};

// ─── CHATS ────────────────────────────────────────────────────────────────────
export const getConversations = async () => {
  try {
    const res = await api.get("/chat/conversations");
    return res.data.conversations;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to get conversations");
  }
};

export const getConversationById = async (id) => {
  try {
    const res = await api.get(`/chat/conversations/${id}`);
    return res.data.conversation;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to get conversation");
  }
};

export const sendChatMessage = async ({ message, conversationId = null, image = null }) => {
  try {
    if (image) {
      const res = await api.post("/chat/upload", {
        conversationId,
        message,
        imageBase64: image
      });
      return res.data.conversation;
    }
    
    const res = await api.post("/chat", {
      message,
      conversationId
    });
    return res.data.conversation;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to send message");
  }
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
      else if (parsed.text) onDone(parsed.text, parsed.conversationId);
    } catch {
      // ignore non-JSON lines
    }
  });
  return blocks[blocks.length - 1];
}

export function streamChat({ message, conversationId, image, onChunk, onDone, onError }) {
  const token = localStorage.getItem("token");
  if (!token) {
    onError("Not authenticated");
    return;
  }

  const body = JSON.stringify({ 
    message, 
    conversationId,
    image
  });

  fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body
  })
    .then((res) => {
      if (!res.ok) throw new Error("Streaming failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          buffer = parseSSE(buffer, onChunk, (text, conversationId) => {
            onDone(text, conversationId);
            buffer = "";
          });
          read();
        }).catch(onError);
      }

      read();
    })
    .catch(onError);
}

// ─── UPLOAD + SSE ─────────────────────────────────────────────────────────────
export function uploadFile({ file, text = "", conversationId, onChunk, onDone, onError }) {
  const token = localStorage.getItem("token");
  if (!token) {
    onError("Not authenticated");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result;
    
    fetch(`${import.meta.env.VITE_API_URL}/chat/upload`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        imageBase64: base64, 
        message: text, 
        conversationId 
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Upload failed");
        const streamReader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        function read() {
          streamReader.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            buffer = parseSSE(buffer, onChunk, (text, conversationId) => {
              onDone(text, conversationId);
              buffer = "";
            });
            read();
          }).catch(onError);
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
  try {
    const res = await api.delete(`/chat/conversations/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to delete conversation");
  }
};

export const getSuggestions = async (prefix) => {
  try {
    const res = await api.post("/chat/suggest", { prefix });
    return res.data.suggestions;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to get suggestions");
  }
};

export const logoutUser = async () => {
  try {
    localStorage.removeItem("token");
    await api.post("/auth/logout");
  } catch (err) {
    console.error("Logout error:", err);
  }
};