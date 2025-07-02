// src/api/chat.js
import api from '../api';
import { EventSourcePolyfill } from 'event-source-polyfill';
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// ————— Authentication —————
export const signupUser = async (name, email, password) => {
  const res = await api.post('/user/signup', { name, email, password });
  return res.data.user;
};

export const loginUser = async (email, password) => {
  const res = await api.post('/user/login', { email, password });
  return res.data.user;
};

export const checkAuthStatus = async () => {
  const res = await api.get('/user/verify');
  return res.data.user;
};

// ————— Conversations —————
export const getConversations = async () => {
  const res = await api.get('/chat/conversations');
  return res.data.conversations;
};

export const getConversationById = async (id) => {
  const res = await api.get(`/chat/conversations/${id}`);
  return res.data.conversation;
};

export const deleteConversation = async (id) => {
  const res = await api.delete(`/chat/conversations/${id}`);
  return res.data;
};

// ————— Non‑streaming chat (fallback) —————
export const sendChat = async ({ message, conversationId, image }) => {
  const payload = { message };
  if (conversationId) payload.conversationId = conversationId;
  if (image)          payload.image          = image;
  const res = await api.post('/chat', payload);
  return res.data;
};

// ————— Streaming chat (SSE) —————
export function streamChat({ message, conversationId, image, onChunk, onDone, onError }) {
  if (!message?.trim() && !image) {
    onError('Message or image is required');
    return;
  }
  const token = getCookie('bot_token');
  const payload = {
    message: message?.trim() || '',
    ...(conversationId && { conversationId }),
    ...(image && { image }),
  };

  fetch(`${import.meta.env.VITE_API_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('unauthorized'));
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}`);
      }

      // SSE parser
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const processBuffer = () => {
        const events = buffer.split('\n\n');
        events.slice(0, -1).forEach((evt) => {
          const dataLine = evt.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) return;
          try {
            const payload = JSON.parse(dataLine.replace(/^data:\s*/, ''));
            if (payload.part) onChunk(payload.part);
            if (payload.text) onDone(payload.text, payload.conversationId);
          } catch {}
        });
        buffer = events[events.length - 1];
      };

      const read = () =>
        reader.read().then(({ done, value }) => {
          if (done) {
            if (buffer.trim()) {
              try {
                const last = JSON.parse(buffer);
                onDone(last.text, last.conversationId);
              } catch {
                onError('Invalid SSE response');
              }
            }
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
          read();
        });

      read();
    })
    .catch((err) => {
      if (err.message === 'Unauthorized') {
        window.dispatchEvent(new CustomEvent('unauthorized'));
      }
      onError(err.message);
    });
}

// ————— Image upload as base64 —————
export function uploadFile({ file, text, conversationId, onChunk, onDone, onError }) {
  if (!(file instanceof Blob)) {
    return onError('uploadFile error: Expected a File or Blob');
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result;
    const token = getCookie('bot_token');
    
    fetch(`${import.meta.env.VITE_API_URL}/chat/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
      body: JSON.stringify({ 
        image: base64, 
        text: text || '', 
        conversationId 
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      // Check for SSE content type
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('text/event-stream')) {
        throw new Error('Invalid response format');
      }
      
      // Setup SSE parser
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const processEvents = () => {
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        
        for (const event of events) {
          const [typeLine, dataLine] = event.split('\n');
          const type = typeLine.replace('event: ', '').trim();
          const data = dataLine ? dataLine.replace('data: ', '') : null;
          
          try {
            const payload = data ? JSON.parse(data) : {};
            
            switch (type) {
              case 'chunk':
                if (payload.part) onChunk(payload.part);
                break;
              case 'done':
                if (payload.text) onDone(payload.text, payload.conversationId);
                break;
              case 'error':
                if (payload.error) onError(payload.error);
                break;
              default:
                console.warn('Unknown SSE event type:', type);
            }
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        }
      };
      
      const readChunk = () => {
        reader.read().then(({ value, done }) => {
          if (done) {
            if (buffer) processEvents();
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          processEvents();
          readChunk();
        }).catch(err => onError(err.message));
      };
      
      readChunk();
    })
    .catch(err => onError(err.message));
  };
  
  reader.onerror = () => onError('Failed to read image');
  reader.readAsDataURL(file);
}
// ————— Suggestions —————
export const getSuggestions = async (prefix) => {
  const res = await api.post('/chat/suggest', { prefix });
  return res.data.suggestions;
};
