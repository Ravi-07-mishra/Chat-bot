"use client"

import { Avatar, Box, Button, IconButton, Typography, CircularProgress, Snackbar, Alert, Divider } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "../assets/context/AuthContext";
import { red, teal } from "@mui/material/colors";
import { MdSend } from "react-icons/md";
import Chatitem from "../components/chat/Chatitem";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const auth = useAuth();
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [currentConversation, setCurrentConversation] = useState(null); // full conversation object
  const [conversationSummaries, setConversationSummaries] = useState([]); // sidebar summaries
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth?.isLoggedIn) {
      navigate("/login");
    }
  }, [auth?.isLoggedIn, navigate]);

  // Auto-scroll chat area
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentConversation]);

  // Load conversation summaries for sidebar
  const loadConversationSummaries = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/chat/conversations", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        setConversationSummaries(data.conversations);
      } else {
        setError(data.message || "Failed to load conversations.");
      }
    } catch (error) {
      console.error("Error loading conversation summaries:", error);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load full conversation by id
  const loadConversation = async (conversationId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/chat/conversations/${conversationId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentConversation(data.conversation);
      } else {
        setError(data.message || "Failed to load conversation.");
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      setError("Failed to load conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // When sending a new message, use the current conversation id if available.
  // If no conversation is selected, a new conversation is created.
  const handleSubmit = async () => {
    const content = inputRef.current?.value?.trim();
    if (!content) return;
    if (inputRef && inputRef.current) {
      inputRef.current.value = "";
    }
    setLoading(true);
    setError(null);
    try {
      const bodyPayload = { message: content };
      if (currentConversation?.conversationId) {
        bodyPayload.conversationId = currentConversation.conversationId;
      }
      const response = await fetch("/api/v1/chat/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await response.json();
      if (response.ok) {
        // Update current conversation with the returned conversation object
        setCurrentConversation(data.conversation);
        // Reload conversation summaries
        loadConversationSummaries();
      } else {
        setError(data.message || "Failed to get response. Please try again.");
      }
    } catch (error) {
      console.error("Error handling chat submission:", error);
      setError("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Start a new conversation
  const startNewConversation = () => {
    setCurrentConversation({ conversationId: null, messages: [] });
  };

  // Render messages for the current conversation
  const renderChatItems = () => {
    if (!currentConversation || !currentConversation.messages) return null;
    return currentConversation.messages.map((msg, i) => (
      <Chatitem key={i} content={msg.content} role={msg.role} />
    ));
  };

  // Load conversation summaries on component mount
  useEffect(() => {
    loadConversationSummaries();
  }, []);

  return (
    <Box sx={{ display: "flex", flex: 1, width: "100%", height: "100%", mt: 3, gap: 3, backgroundColor: "rgb(7, 15, 25)", borderRadius: 2, p: 2 }}>
      {/* Sidebar with conversation summaries */}
      <Box sx={{ display: { md: "flex", xs: "none" }, flex: 0.3, flexDirection: "column", borderRight: "1px solid #333", pr: 2 }}>
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
              sx={{
                p: 1,
                mb: 1,
                cursor: "pointer",
                bgcolor: "#222",
                borderRadius: 1,
                "&:hover": { bgcolor: "#333" },
              }}
              onClick={() => loadConversation(summary.conversationId)}
            >
              <Typography variant="body2" color="white">
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
              <Avatar sx={{ ml: "0" }}>
                <img src="openai.png" alt="gemini" width={"30px"} />
              </Avatar>
              <CircularProgress size={24} sx={{ color: "white" }} />
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            width: "100%",
            p: 2,
            mt: 2,
            bgcolor: "rgb(17,27,39)",
            display: "flex",
            borderRadius: 3,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <input
            type="text"
            placeholder="Type your message here..."
            style={{
              width: "100%",
              backgroundColor: "transparent",
              padding: "10px",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: "18px",
              fontFamily: "'Work Sans', sans-serif",
            }}
            ref={inputRef}
            onKeyPress={handleKeyPress}
          />
          <IconButton
            sx={{
              ml: "auto",
              color: teal[300],
              transition: "all 0.2s ease",
              "&:hover": { color: teal[100], transform: "scale(1.1)" },
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            <MdSend />
          </IconButton>
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;
