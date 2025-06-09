"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useAuth } from "../assets/context/AuthContext";
import { red, teal } from "@mui/material/colors";
import { MdSend, MdMic } from "react-icons/md";
import Chatitem from "../components/chat/Chatitem";
import { useNavigate } from "react-router-dom";

// Base API URL from environment
const API_BASE = import.meta.env.VITE_API_URL || "";

const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "API call failed");
  }
  return data;
};

const Chat = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [currentConversation, setCurrentConversation] = useState({ messages: [], conversationId: null });
  const [conversationSummaries, setConversationSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  // Initialize SpeechRecognition
  useEffect(() => {
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.onresult = handleSpeechResult;
      recognition.onerror = handleSpeechError;
      setSpeechRecognition(recognition);
    } else {
      console.warn("Speech Recognition API not supported.");
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth?.isLoggedIn) {
      navigate("/login");
    }
  }, [auth?.isLoggedIn, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [currentConversation]);

  const loadConversationSummaries = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const data = await fetchAPI("/api/v1/chat/conversations");
      setConversationSummaries(data.conversations || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI(`/api/v1/chat/conversations/${conversationId}`);
      setCurrentConversation(data.conversation);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const content = inputRef.current?.value?.trim();
    if (!content) return;
    inputRef.current.value = "";
    setLoading(true);
    setError(null);
    try {
      const payload = { message: content };
      if (currentConversation.conversationId) {
        payload.conversationId = currentConversation.conversationId;
      }
      const data = await fetchAPI("/api/v1/chat/new", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCurrentConversation(data.conversation);
      loadConversationSummaries();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startNewConversation = () => setCurrentConversation({ conversationId: null, messages: [] });

  const renderChatItems = () =>
    currentConversation.messages.map((msg, i) => (
      <Chatitem key={msg.id || i} content={msg.content} role={msg.role} />
    ));

  const speakResponse = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  const handleSpeechResult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (event.results[0].isFinal) {
      inputRef.current.value = transcript;
      handleSubmit();
    }
  };

  const handleSpeechError = (event) => {
    console.error("Speech Recognition Error:", event);
    setIsListening(false);
  };

  const toggleSpeechRecognition = () => {
    if (!speechRecognition) return;
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    loadConversationSummaries();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100%",
        width: "100%",
        p: { xs: 1, md: 3 },
        gap: 2,
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: { xs: "100%", md: "30%" },
          borderRight: { md: "1px solid #333" },
          overflowY: "auto",
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={startNewConversation}
        >
          New Conversation
        </Button>

        {loadingConversations ? (
          <CircularProgress />
        ) : !conversationSummaries.length ? (
          <Typography>No conversations found</Typography>
        ) : (
          conversationSummaries.map((s) => (
            <Box
              key={s.conversationId}
              onClick={() => loadConversation(s.conversationId)}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                m: 1,
                borderRadius: 2,
                cursor: "pointer",
                backgroundColor: "rgba(255,255,255,0.05)",
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <Avatar sx={{ bgcolor: teal[700] }}>
                {s.lastMessage?.content?.charAt(0).toUpperCase() || '?'}
              </Avatar>
              <Typography
                noWrap
                sx={{ ml: 2, flex: 1 }}
              >
                {s.lastMessage?.content || 'Empty'}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      {/* Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          align="center"
          sx={{ fontSize: { xs: '1.5rem', md: '2.5rem' }, mb: 2 }}
        >
          Chat with Gemini Pro
        </Typography>

        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(17,27,39,0.3)',
          }}
        >
          {currentConversation.messages.length ? (
            renderChatItems()
          ) : (
            <Box textAlign="center" sx={{ mt: 4, opacity: 0.6 }}>Start a conversation</Box>
          )}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}
        >
          <IconButton onClick={toggleSpeechRecognition} color={isListening ? 'secondary' : 'primary'}>
            <MdMic size={24} />
          </IconButton>
          <Box
            component="textarea"
            ref={inputRef}
            onKeyPress={handleKeyPress}
            rows={isMdUp ? 1 : 2}
            placeholder="Type a message"
            style={{
              flex: 1,
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              padding: '8px',
              color: '#fff',
              resize: 'none',
              border: 'none',
            }}
          />
          <IconButton type="submit">
            <MdSend size={24} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
