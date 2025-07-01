import api from "../api";
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
export const signupUser = async (name, email, password) => {
  try {
    const res = await api.post("/user/signup", { name, email, password });
    return res.data.user;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Signup failed");
  }
};

export const loginUser = async (email, password) => {
  try {
    const res = await api.post("/user/login", { email, password });
    return res.data.user;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Login failed");
  }
};

export const checkAuthStatus = async () => {
  try {
    const res = await api.get("/user/verify");
    return res.data.user;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("Not authenticated");
    }
    throw new Error("Authentication check failed");
  }
};

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
  // Validate payload
  if (!message?.trim() && !image) {
    onError("Message or image is required");
    return;
  }

  // Get token explicitly
  const token = getCookie('bot_token');

  fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    credentials: "include",
    body: JSON.stringify({ 
      message: message || "", 
      conversationId,
      image: image || null 
    }),
  }).then((res) => {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent("unauthorized"));
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) {
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer);
              if (data.text) onDone(data.text, data.conversationId);
            } catch {
              onError("Invalid response format");
            }
          }
          return;
        }
        
        buffer += decoder.decode(value, { stream: true });
        buffer = parseSSE(buffer, onChunk, (text, conversationId) => {
          onDone(text, conversationId);
          buffer = "";
        });
        read();
      }).catch(onError);
    }
    
    read();
  }).catch(err => {
    if (err.message.includes("401")) {
      window.dispatchEvent(new CustomEvent("unauthorized"));
    }
    onError(err.message);
  });
}
export function uploadFile({ file, text = "", conversationId, onChunk, onDone, onError }) {
  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result;
    
    fetch(`${import.meta.env.VITE_API_URL}/chat/upload`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      credentials: "include",
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