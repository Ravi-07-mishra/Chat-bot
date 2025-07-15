// src/api/chat.js
import api from '../api';
import { EventSourcePolyfill } from 'event-source-polyfill';
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
// authAPI.js
export const signupUser = async (name, email, password) => {
  const res = await api.post('/user/signup', { name, email, password });
  return res.data.user;
};

// Remove the sendOtp function entirely

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
  if ((!message || !message.trim()) && !image) {
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

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const processChunk = () => {
        // Process complete events separated by double newline
        while (buffer.includes('\n\n')) {
          const eventEndIndex = buffer.indexOf('\n\n');
          const eventData = buffer.substring(0, eventEndIndex);
          buffer = buffer.substring(eventEndIndex + 2);
          
          const lines = eventData.split('\n');
          let eventType = 'message';
          let dataContent = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              dataContent = line.replace('data:', '').trim();
            }
          }
          
          try {
            const data = JSON.parse(dataContent);
            if (eventType === 'chunk' && data.part) {
              onChunk(data.part);
            } else if (eventType === 'done' && data.text) {
              onDone(data.text, data.conversationId);
            }
          } catch (err) {
            console.error('Error parsing event:', { eventType, dataContent }, err);
          }
        }
      };

      const readLoop = () =>
        reader.read().then(({ done, value }) => {
          if (done) {
            if (buffer.trim()) {
              console.warn('Unprocessed buffer content:', buffer);
            }
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          processChunk();
          return readLoop();
        });

      return readLoop();
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
      
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('text/event-stream')) {
        throw new Error('Invalid response format');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      const processEvents = () => {
        // Process complete events separated by double newline
        while (buffer.includes('\n\n')) {
          const eventEndIndex = buffer.indexOf('\n\n');
          const eventData = buffer.substring(0, eventEndIndex);
          buffer = buffer.substring(eventEndIndex + 2);
          
          const lines = eventData.split('\n');
          let eventType = 'message';
          let dataContent = '';
          
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              dataContent = line.replace('data:', '').trim();
            }
          }
          
          try {
            const payload = dataContent ? JSON.parse(dataContent) : null;
            
            switch (eventType) {
              case 'chunk':
                if (payload?.part) onChunk(payload.part);
                break;
              case 'done':
                if (payload?.text) onDone(payload.text, payload.conversationId);
                break;
              case 'error':
                if (payload?.error) onError(payload.error);
                break;
              default:
                console.warn('Unknown SSE event type:', eventType);
            }
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        }
      };
      
      const readChunk = () => {
        reader.read().then(({ value, done }) => {
          if (done) {
            if (buffer.trim()) {
              console.warn('Unprocessed buffer content:', buffer);
            }
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
