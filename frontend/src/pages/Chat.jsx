"use client";

import { Avatar, Box, Button, IconButton, Typography, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "../assets/context/AuthContext";
import { red, teal } from "@mui/material/colors";
import { MdSend, MdMic } from "react-icons/md";
import Chatitem from "../components/chat/Chatitem";
import { useNavigate } from "react-router-dom";

// Helper function for API calls
const fetchAPI = async (url, options = {}) => {
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
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationSummaries, setConversationSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);

  // Initialize speech recognition (Speech-to-Text)
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.onresult = handleSpeechResult;
      recognition.onerror = handleSpeechError;
      setSpeechRecognition(recognition);
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth?.isLoggedIn) {
      navigate("/login");
    }
  }, [auth?.isLoggedIn, navigate]);

  // Auto-scroll chat area when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentConversation]);

  // Load conversation summaries for the sidebar
  const loadConversationSummaries = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const data = await fetchAPI("/api/v1/chat/conversations");
      setConversationSummaries(data.conversations);
    } catch (err) {
      console.error("Error loading conversation summaries:", err);
      setError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load a full conversation by its id
  const loadConversation = async (conversationId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI(`/api/v1/chat/conversations/${conversationId}`);
      setCurrentConversation(data.conversation);
    } catch (err) {
      console.error("Error loading conversation:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle message submission
  const handleSubmit = async () => {
    const content = inputRef.current?.value?.trim();
    if (!content) return;
    inputRef.current.value = "";
    setLoading(true);
    setError(null);
    try {
      const payload = { message: content };
      if (currentConversation?.conversationId) {
        payload.conversationId = currentConversation.conversationId;
      }
      const data = await fetchAPI("/api/v1/chat/new", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCurrentConversation(data.conversation);
      // Reload summaries after a successful message send
      loadConversationSummaries();
    } catch (err) {
      console.error("Error handling chat submission:", err);
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

  // Start a new conversation
  const startNewConversation = () => {
    setCurrentConversation({ conversationId: null, messages: [] });
  };

  // Render chat messages
  const renderChatItems = () => {
    if (!currentConversation?.messages) return null;
    return currentConversation.messages.map((msg, i) => (
      <Chatitem key={msg.id || i} content={msg.content} role={msg.role} />
    ));
  };

  // Read out the bot's response using SpeechSynthesis
  const speakResponse = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    window.speechSynthesis.speak(speech);
  };

  // Handle speech-to-text result
  const handleSpeechResult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (event.results[0].isFinal) {
      inputRef.current.value = transcript;
      handleSubmit();
    }
  };

  const handleSpeechError = (event) => {
    console.error("Speech recognition error", event);
  };

  // Start/Stop speech recognition (Speech-to-Text)
  const toggleSpeechRecognition = () => {
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  // Load conversation summaries on component mount
  useEffect(() => {
    loadConversationSummaries();
  }, []);

  return (
    <Box sx={{ display: "flex", flex: 1, width: "100%", height: "100%", mt: 3, gap: 3, backgroundColor: "rgb(7, 15, 25)", borderRadius: 2, p: 2 }}>
      {/* Sidebar with conversation summaries */}
      <Box sx={{ display: { md: "flex", xs: "none" }, flex: 0.3, flexDirection: "column", borderRight: "1px solid #333", pr: 2, maxHeight: "85vh", overflowY: "auto" }}>
        <Button onClick={startNewConversation} sx={{ mb: 2, bgcolor: teal[700], color: "white", borderRadius: 2, ":hover": { bgcolor: teal[600] } }}>
          New Conversation
        </Button>
        {loadingConversations ? (
          <CircularProgress size={24} sx={{ color: "white" }} />
        ) : conversationSummaries.length === 0 ? (
          <Typography color="white">No conversations found</Typography>
        ) : (
          conversationSummaries.map((summary) => (
            <Box
              key={summary.conversationId}
              onClick={() => loadConversation(summary.conversationId)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                mb: 1.5,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 3,
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  transform: "scale(1.02)",
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: teal[700],
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {summary.lastMessage?.content?.charAt(0)?.toUpperCase() || "?"}
              </Avatar>
              <Typography
                variant="body1"
                color="white"
                noWrap
                sx={{ flex: 1, fontWeight: 500, fontSize: "15px" }}
              >
                {summary.lastMessage ? summary.lastMessage.content : "Empty conversation"}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      {/* Chat Area */}
      <Box sx={{ display: "flex", flex: { md: 0.7, xs: 1 }, flexDirection: "column", px: 3, width: "100%" }}>
        <Typography
          sx={{
            textAlign: "center",
            fontSize: { xs: "28px", md: "40px" },
            color: "white",
            mb: 2,
            mx: "auto",
            fontWeight: 600,
            background: `linear-gradient(90deg, ${teal[300]}, ${teal[100]})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Chat with Gemini Pro
        </Typography>

        <Box
          ref={chatContainerRef}
          sx={{
            width: "100%",
            height: "60vh",
            borderRadius: 3,
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            bgcolor: "rgba(17,27,39,0.3)",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)",
            p: 1,
          }}
        >
          {currentConversation && currentConversation.messages && currentConversation.messages.length > 0 ? (
            renderChatItems()
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.7 }}>
              <Typography color="white" variant="h6" sx={{ textAlign: "center" }}>
                Start a conversation
              </Typography>
              <Typography color="gray" variant="body2" sx={{ textAlign: "center", mt: 1 }}>
                Type a message below to begin
              </Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: "flex", p: 2, bgcolor: "#004d56", gap: 2, alignItems: "center" }}>
              <Avatar>
                <img src="openai.png" alt="gemini" width="30px" />
              </Avatar>
              <CircularProgress size={20} sx={{ color: "white" }} />
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <IconButton onClick={toggleSpeechRecognition} color={isListening ? "secondary" : "primary"}>
            <MdMic size={28} />
          </IconButton>
          <Box
            component="input"
            ref={inputRef}
            onKeyPress={handleKeyPress}
            sx={{
              background: "rgba(255, 255, 255, 0.1)",
              color: "white",
              border: "none",
              borderRadius: 3,
              p: 1.5,
              fontSize: "16px",
              flex: 1,
            }}
            placeholder="Type a message"
          />
          <IconButton onClick={() => speakResponse(currentConversation?.messages?.[currentConversation.messages.length - 1]?.content)} color="primary">
            <MdSend size={28} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
