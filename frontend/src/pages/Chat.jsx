// src/pages/Chat.jsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Drawer,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import TranslateIcon from "@mui/icons-material/Translate";
import { red, teal, grey } from "@mui/material/colors";
import {
  MdSend,
  MdMic,
  MdUploadFile,
  MdMenu,
  MdPause,
  MdPlayArrow,
  MdClose,
} from "react-icons/md";
import Chatitem from "../components/chat/Chatitem";
import { useNavigate } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useAuth } from "../assets/context/AuthContext";

import {
  getConversations,
  getConversationById,
  streamChat,
  uploadFile,
  getSuggestions,
  deleteConversation,
} from "../helpers/api-communicator";

// Simple mock translation function (no API calls)
const translateText = async (text, targetLang) => {
  if (!text || text.trim() === '') return text;
  
  // Simulate translation delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock translation - in a real app you might use a library or different approach
  return `[${targetLang.toUpperCase()}] ${text}`;
};

export default function Chat() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const auth = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const debounceRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentConversation, setCurrentConversation] = useState({
    conversationId: null,
    messages: [],
  });
  const [conversationSummaries, setConversationSummaries] = useState([]);
  const [inputText, setInputText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Speech & Translation States
  const [lang, setLang] = useState("en");
  const [isPaused, setPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [userInteracted, setUserInteracted] = useState(false);

  // Set user interacted when they perform any action
  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // — Persist last convoId to localStorage —
  useEffect(() => {
    if (currentConversation.conversationId) {
      localStorage.setItem(
        "lastConvId",
        currentConversation.conversationId
      );
    }
  }, [currentConversation.conversationId]);

  // — On mount: load summaries & last convo —
  useEffect(() => {
    if (auth?.isLoggedIn) {
      loadConversationSummaries();
      const last = localStorage.getItem("lastConvId");
      if (last) loadConversation(last);
    }
  }, [auth?.isLoggedIn]);

  // — Redirect if not logged in —
  useEffect(() => {
    if (auth?.isLoggedIn === false) navigate("/login");
  }, [auth?.isLoggedIn, navigate]);

  // — Auto‑scroll chat container —
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [currentConversation.messages, loading, translatedMessages]);

  // — Speak assistant messages —
  useEffect(() => {
    const msgs = currentConversation.messages;
    if (msgs.length === 0 || !("speechSynthesis" in window) || !userInteracted) return;
    
    const last = msgs[msgs.length - 1];
    if (last.role === "assistant" && !isSpeaking) {
      try {
        // Cancel any ongoing speech
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        
        const utt = new SpeechSynthesisUtterance(last.content);
        utt.lang = lang;
        utt.rate = 1;
        utt.pitch = 1;
        utt.volume = 1;
        
        // Store in ref for global access
        synthRef.current = utt;
        
        // Event listeners for speech synthesis
        utt.onstart = () => {
          setIsSpeaking(true);
          setPaused(false);
        };
        
        utt.onend = () => {
          setIsSpeaking(false);
          setPaused(false);
        };
        
        utt.onerror = (e) => {
          console.error("Speech synthesis error:", e);
          setIsSpeaking(false);
          setPaused(false);
          
          // Handle specific errors
          if (e.error === 'not-allowed') {
            setError("Speech blocked by browser. Please allow audio permissions.");
          }
        };
        
        window.speechSynthesis.speak(utt);
      } catch (e) {
        console.error("Speech synthesis failed:", e);
        setError("Speech synthesis failed. Please check browser permissions.");
      }
    }
  }, [currentConversation.messages, lang, userInteracted]);

  // — Load all conversation summaries —
  const loadConversationSummaries = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const convs = await getConversations();
      setConversationSummaries(convs);
    } catch (err) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  };

  // — Load specific conversation by ID —
  const loadConversation = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const convo = await getConversationById(id);
      setCurrentConversation(convo);
      setTranslatedMessages({}); // Reset translations when loading new conversation
    } catch (err) {
      setError(err.message || "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  // — Delete conversation —
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this chat?"))
      return;
    setLoadingConversations(true);
    setError(null);
    try {
      await deleteConversation(id);
      if (currentConversation.conversationId === id) {
        setCurrentConversation({ conversationId: null, messages: [] });
        setTranslatedMessages({});
      }
      await loadConversationSummaries();
    } catch (err) {
      setError(err.message || "Failed to delete conversation");
    } finally {
      setLoadingConversations(false);
    }
  };

  // — File selection & validation —
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match("image.*")) {
      return setError("Please select an image file");
    }
    if (file.size > 5 * 1024 * 1024) {
      return setError("Image size should be less than 5 MB");
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // — Send text-only message —
  const handleTextMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    setLoading(true);
    setError(null);

    // Optimistic UI: append the user message immediately
    setCurrentConversation(c => ({
      ...c,
      messages: [...c.messages, { role: "user", content: text }]
    }));

    let buffer = "";

    // Stream the chat
    streamChat({
      message: text,
      conversationId: currentConversation.conversationId,
      onChunk: (part) => {
        buffer += part;
        setCurrentConversation(c => ({
          ...c,
          messages: [
            ...c.messages.filter(m => m.role !== "assistant-stream"),
            { role: "assistant-stream", content: buffer }
          ]
        }));
      },
      onDone: (fullText, convId) => {
        setCurrentConversation(c => ({
          conversationId: convId || c.conversationId,
          messages: [
            ...c.messages.filter(m => m.role !== "assistant-stream"),
            { role: "assistant", content: fullText }
          ]
        }));
        setLoading(false);
        loadConversationSummaries();
      },
      onError: (errMsg) => {
        setError(errMsg || "Failed to send message");
        setLoading(false);
        // Roll back the optimistic user message
        setCurrentConversation(c => ({
          ...c,
          messages: c.messages.slice(0, -1)
        }));
      }
    });
  };

  // — Unified send handler (text vs. image) —
  const handleSend = () => {
    if (imageFile) {
      const text = inputText.trim();
      setInputText("");
      setLoading(true);
      setError(null);

      // Optimistic UI with image preview
      setCurrentConversation((c) => ({
        ...c,
        messages: [
          ...c.messages,
          { role: "user", content: text, image: imagePreview },
        ],
      }));

      let buffer = "";
      uploadFile({
        file: imageFile,
        text,
        conversationId: currentConversation.conversationId,
        onChunk: (part) => {
          buffer += part;
          setCurrentConversation((c) => ({
            ...c,
            messages: [
              ...c.messages.filter((m) => m.role !== "assistant-stream"),
              { role: "assistant-stream", content: buffer },
            ],
          }));
        },
        onDone: (full, convId) => {
          setCurrentConversation((c) => ({
            conversationId: convId || c.conversationId,
            messages: [
              ...c.messages.filter((m) => m.role !== "assistant-stream"),
              { role: "assistant", content: full },
            ],
          }));
          clearImage();
          loadConversationSummaries();
          setLoading(false);
        },
        onError: (errMsg) => {
          setError(errMsg || "Failed to upload image");
          setLoading(false);
          clearImage();
          // Rollback optimistic
          setCurrentConversation((c) => ({
            ...c,
            messages: c.messages.slice(0, -1),
          }));
        },
      });
    } else {
      handleTextMessage();
    }
  };

  // — Debounced suggestions —
  const handleInputChange = (event, value, reason) => {
    setInputText(value || "");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (reason === "input" && value) {
      debounceRef.current = setTimeout(async () => {
        try {
          const sug = await getSuggestions(value);
          setSuggestions(sug);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    } else if (!value) {
      setSuggestions([]);
    }
  };

  // — Speech Recognition setup —
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Speech recognition not supported in this browser");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setInputText(transcript);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      if (inputText.trim()) {
        handleSend();
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      setError(`Speech recognition error: ${event.error}`);
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang]);

  // — Toggle speech recognition —
  const toggleSpeech = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (error) {
        console.error("Speech recognition start error:", error);
        setError("Failed to start speech recognition. Please check permissions.");
      }
    }
  };

  // — Pause/resume speech synthesis —
  const handlePauseResume = () => {
    if (!window.speechSynthesis) {
      setError("Speech synthesis not supported in this browser");
      return;
    }
    
    if (isPaused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  // — Handle language change —
  const handleLangChange = (e) => {
    setLang(e.target.value);
  };

  // — Start new conversation —
  const startNew = () => {
    setCurrentConversation({ conversationId: null, messages: [] });
    setError(null);
    clearImage();
    setTranslatedMessages({});
  };

  // — Translate a message —
  const handleTranslateMessage = async (index) => {
    if (!currentConversation.messages[index]) return;
    
    // If already translated, revert to original
    if (translatedMessages[index]) {
      setTranslatedMessages(prev => {
        const newTrans = {...prev};
        delete newTrans[index];
        return newTrans;
      });
      return;
    }
    
    setIsTranslating(true);
    try {
      const message = currentConversation.messages[index];
      const translated = await translateText(message.content, lang);
      
      setTranslatedMessages(prev => ({
        ...prev,
        [index]: translated
      }));
    } catch (error) {
      setError("Translation failed: " + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  // ===== Enhanced Styles =====
  const styles = {
    mainContainer: {
      display: "flex",
      height: "100vh",
      bgcolor: "#0a1929",
      backgroundImage: "linear-gradient(135deg, #0a1929 0%, #122c44 100%)",
      overflow: "hidden",
    },
    sidebar: {
      display: "flex",
      flexDirection: "column",
      width: { xs: "100%", md: "30%" },
      maxWidth: { md: 380 },
      p: { xs: 1.5, sm: 2 },
      backgroundColor: "rgba(16, 30, 49, 0.95)",
      borderRadius: { xs: 0, md: 2 },
      height: "100%",
      overflowY: "auto",
      borderRight: { md: "1px solid rgba(46, 125, 150, 0.2)" },
      backdropFilter: "blur(4px)",
      boxShadow: { md: "0 4px 20px rgba(0, 0, 0, 0.3)" }
    },
    chatContainer: {
      width: "100%",
      height: { xs: "60vh", sm: "65vh", md: "70vh" },
      borderRadius: 3,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      bgcolor: "rgba(17, 34, 56, 0.4)",
      boxShadow: "inset 0 2px 12px rgba(0, 0, 0, 0.25)",
      p: 1.5,
      border: "1px solid rgba(46, 125, 150, 0.2)",
      background: "linear-gradient(to bottom, rgba(12, 35, 64, 0.6), rgba(8, 25, 48, 0.8))"
    },
    inputContainer: {
      display: "flex",
      alignItems: "center",
      mt: 2,
      gap: 1,
      flexWrap: "wrap",
      p: 1,
      borderRadius: 3,
      bgcolor: "rgba(16, 30, 49, 0.7)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(46, 125, 150, 0.2)",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)"
    },
    newChatButton: {
      mb: 2,
      bgcolor: "rgba(0, 150, 136, 0.8)",
      color: "white",
      borderRadius: 2,
      fontWeight: 600,
      fontSize: "1rem",
      py: 1.5,
      textTransform: "none",
      transition: "all 0.3s ease",
      ":hover": { 
        bgcolor: "rgba(0, 180, 162, 0.9)",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 8px rgba(0, 150, 136, 0.4)"
      }
    },
    chatHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 2,
      p: 1,
      flexWrap: "wrap",
      gap: 2
    },
    headerText: {
      textAlign: "center",
      fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
      fontWeight: 700,
      background: "linear-gradient(90deg, #4db6ac, #81c784)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow: "0 2px 4px rgba(0,0,0,0.2)"
    },
    emptyChat: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      flexDirection: "column",
      textAlign: "center",
      color: "#90a4ae",
      p: 3
    },
    suggestionItem: {
      bgcolor: "rgba(255, 255, 255, 0.05)",
      borderRadius: 1,
      px: 1.5,
      py: 0.5,
      m: 0.5,
      cursor: "pointer",
      transition: "all 0.2s ease",
      ":hover": {
        bgcolor: "rgba(0, 150, 136, 0.2)",
        transform: "scale(1.02)"
      }
    },
    mobileMenuButton: {
      position: "absolute", 
      top: 10, 
      left: 10, 
      zIndex: 10,
      color: "#4db6ac",
      bgcolor: "rgba(16, 30, 49, 0.7)",
      backdropFilter: "blur(4px)",
      border: "1px solid rgba(46, 125, 150, 0.2)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      "&:hover": {
        bgcolor: "rgba(0, 150, 136, 0.3)"
      }
    },
    translatedBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      fontSize: "0.7rem",
      bgcolor: "rgba(0, 150, 136, 0.3)",
      color: "white",
      px: 1,
      borderRadius: 2
    },
    closeButton: {
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 10,
      color: "#e57373",
    }
  };

  // — Sidebar markup —
  const sidebarContent = (
    <Box sx={styles.sidebar}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button onClick={startNew} sx={styles.newChatButton}>
          + New Conversation
        </Button>
        
        {/* Close button for mobile */}
        {!isMdUp && (
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={styles.closeButton}
          >
            <MdClose size={24} />
          </IconButton>
        )}
      </Box>

      {loadingConversations ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} sx={{ color: "#4db6ac" }} />
        </Box>
      ) : conversationSummaries.length === 0 ? (
        <Typography color="#90a4ae" textAlign="center" sx={{ py: 2 }}>
          No conversations yet
        </Typography>
      ) : (
        <List sx={{ overflowY: "auto", py: 1 }}>
          {conversationSummaries.map((s) => {
            const isActive =
              s.conversationId === currentConversation.conversationId;
            return (
              <ListItem
                key={s.conversationId}
                onClick={() => {
                  loadConversation(s.conversationId);
                  if (!isMdUp) setMobileOpen(false);
                }}
                sx={{
                  mb: 1.5,
                  bgcolor: isActive
                    ? "rgba(0, 150, 136, 0.25)"
                    : "rgba(255, 255, 255, 0.05)",
                  borderRadius: 3,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: isActive 
                      ? "rgba(0, 180, 162, 0.3)"
                      : "rgba(255,255,255,0.1)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: isActive ? "#00897b" : "#2e7d32",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {(s.title || "?")[0].toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={s.title || "New Conversation"}
                  primaryTypographyProps={{
                    color: "white",
                    fontWeight: 500,
                    noWrap: true,
                    fontSize: "0.95rem"
                  }}
                  secondary={
                    (s.lastMessage?.content?.substring(0, 40) || "") +
                    (s.lastMessage?.content?.length > 40 ? "..." : "")
                  }
                  secondaryTypographyProps={{
                    color: "#b0bec5",
                    noWrap: true,
                    fontSize: "0.8rem"
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.conversationId);
                  }}
                  sx={{ color: "#e57373", ml: 1 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={styles.mainContainer}>
      {/* Drawer for small screens */}
      {!isMdUp && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: "85%",
              maxWidth: 320,
              boxSizing: "border-box",
              ...styles.sidebar,
              borderRadius: 0
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      {/* Always show sidebar on md+ */}
      {isMdUp && sidebarContent}

      {/* Main Chat Panel */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          px: { xs: 1, sm: 3 },
          py: { xs: 1, sm: 2 },
          width: "100%",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Menu button */}
        {!isMdUp && (
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={styles.mobileMenuButton}
          >
            <MdMenu size={24} />
          </IconButton>
        )}

        <Box sx={styles.chatHeader}>
          <Typography sx={styles.headerText}>
            Gemini Chat Assistant
          </Typography>
          
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {currentConversation.conversationId && (
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                sx={{
                  color: "#ff8a80",
                  borderColor: "#ff8a80",
                  "&:hover": {
                    bgcolor: "rgba(255, 138, 128, 0.1)",
                    borderColor: "#ff5252"
                  }
                }}
                onClick={() =>
                  handleDelete(currentConversation.conversationId)
                }
                disabled={loadingConversations}
                size="small"
              >
                Delete
              </Button>
            )}
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: "#b0bec5" }}>Language</InputLabel>
              <Select
                value={lang}
                label="Language"
                onChange={handleLangChange}
                sx={{
                  color: "white",
                  ".MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(46, 125, 150, 0.3)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#4db6ac",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#4db6ac",
                  },
                  ".MuiSvgIcon-root": { color: "#4db6ac" }
                }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
                <MenuItem value="hi">Hindi</MenuItem>
                <MenuItem value="ja">日本語</MenuItem>
                <MenuItem value="zh">中文</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Chat History */}
        <Box
          ref={chatContainerRef}
          sx={styles.chatContainer}
        >
          {error && (
            <Typography color="#ff8a80" sx={{ 
              p: 1.5, 
              bgcolor: "rgba(255, 138, 128, 0.1)", 
              borderRadius: 2,
              mb: 1
            }}>
              {error}
            </Typography>
          )}

          {currentConversation.messages.length === 0 ? (
            <Box sx={styles.emptyChat}>
              <Typography variant="h6" sx={{ 
                mb: 1, 
                color: "#e0f7fa", 
                fontWeight: 500,
                fontSize: { xs: "1.2rem", sm: "1.5rem" }
              }}>
                Welcome to Gemini Chat
              </Typography>
              <Typography sx={{ 
                color: "#90a4ae", 
                maxWidth: 500,
                mb: 3
              }}>
                Start by typing a message, asking a question, or uploading an image
              </Typography>
              <Box sx={{ 
                display: "flex", 
                flexWrap: "wrap", 
                justifyContent: "center", 
                gap: 1 
              }}>
                {["What is Gemini AI?", "How does this work?", "Explain quantum computing", "Tell me a joke"].map((text, i) => (
                  <Typography 
                    key={i} 
                    sx={styles.suggestionItem}
                    onClick={() => {
                      setInputText(text);
                      setTimeout(handleSend, 300);
                    }}
                  >
                    {text}
                  </Typography>
                ))}
              </Box>
            </Box>
          ) : (
            currentConversation.messages.map((msg, i) => (
              <Box key={i} sx={{ position: "relative" }}>
                <Chatitem 
                  message={{
                    ...msg,
                    content: translatedMessages[i] || msg.content
                  }} 
                />
                
                {/* Translation button for assistant messages */}
                {msg.role === "assistant" && (
                  <Tooltip 
                    title={translatedMessages[i] 
                      ? "Show original text" 
                      : "Translate to selected language"} 
                    arrow
                  >
                    <IconButton
                      onClick={() => handleTranslateMessage(i)}
                      disabled={isTranslating}
                      sx={{
                        position: "absolute",
                        right: 8,
                        bottom: 8,
                        bgcolor: translatedMessages[i] 
                          ? "rgba(0, 180, 162, 0.5)" 
                          : "rgba(0, 150, 136, 0.2)",
                        color: "white",
                        "&:hover": {
                          bgcolor: "rgba(0, 150, 136, 0.4)"
                        }
                      }}
                      size="small"
                    >
                      {isTranslating ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <TranslateIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
                
                {/* Translation badge */}
                {translatedMessages[i] && (
                  <Typography sx={styles.translatedBadge}>
                    Translated
                  </Typography>
                )}
              </Box>
            ))
          )}

          {loading && (
            <Box
              sx={{
                display: "flex",
                p: 2,
                bgcolor: "rgba(0, 77, 64, 0.4)",
                gap: 2,
                alignItems: "center",
                borderRadius: 2,
                border: "1px solid rgba(0, 150, 136, 0.3)",
                mt: 1
              }}
            >
              <Avatar sx={{ bgcolor: "#00695c" }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  bgcolor: "white", 
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Box sx={{ 
                    width: 16, 
                    height: 16, 
                    bgcolor: "#00695c",
                    borderRadius: "50%" 
                  }} />
                </Box>
              </Avatar>
              <CircularProgress size={20} sx={{ color: "#4db6ac" }} />
            </Box>
          )}
        </Box>

        {/* Image Preview */}
        {imagePreview && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: "rgba(16, 30, 49, 0.6)",
              borderRadius: 2,
              border: "1px solid rgba(46, 125, 150, 0.2)",
              position: "relative"
            }}
          >
            <Typography
              variant="subtitle2"
              color="#e0f7fa"
              sx={{ mb: 1, fontWeight: 500 }}
            >
              Image Preview
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  height: "70px",
                  width: "70px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "2px solid rgba(0, 150, 136, 0.3)"
                }}
              />
              <IconButton 
                size="small" 
                onClick={clearImage}
                sx={{
                  bgcolor: "rgba(229, 115, 115, 0.2)",
                  "&:hover": { bgcolor: "rgba(229, 115, 115, 0.3)" }
                }}
              >
                <MdClose color="#e57373" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Input & Controls */}
        <Box sx={styles.inputContainer}>
          <Tooltip title={isListening ? "Stop listening" : "Start voice input"} arrow>
            <IconButton 
              onClick={toggleSpeech} 
              sx={{ 
                color: isListening ? "#ff5252" : "#4db6ac",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                "&:hover": { bgcolor: "rgba(0, 150, 136, 0.2)" }
              }}
            >
              <MdMic size={24} />
            </IconButton>
          </Tooltip>

          <Tooltip title={isPaused ? "Resume speech" : "Pause speech"} arrow>
            <IconButton 
              onClick={handlePauseResume} 
              sx={{ 
                color: "#4db6ac",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                "&:hover": { bgcolor: "rgba(0, 150, 136, 0.2)" },
                display: isSpeaking ? "flex" : "none"
              }}
            >
              {isPaused ? <MdPlayArrow size={24} /> : <MdPause size={24} />}
            </IconButton>
          </Tooltip>

          <Autocomplete
            freeSolo
            options={suggestions}
            inputValue={inputText}
            onInputChange={handleInputChange}
            filterOptions={(opts) => opts}
            sx={{
              flex: 1,
              minWidth: 150,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder="Type your message..."
                InputProps={{
                  ...params.InputProps,
                  sx: {
                    color: "white",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "rgba(77, 182, 172, 0.5) !important",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#4db6ac !important",
                      boxShadow: "0 0 0 2px rgba(77, 182, 172, 0.2)"
                    },
                  },
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            )}
          />

          <Tooltip title="Upload image" arrow>
            <IconButton
              onClick={() => fileInputRef.current.click()}
              sx={{ 
                color: "#4db6ac",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                "&:hover": { bgcolor: "rgba(0, 150, 136, 0.2)" }
              }}
            >
              <MdUploadFile size={24} />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </IconButton>
          </Tooltip>

          <Tooltip title="Send message" arrow>
            <IconButton
              onClick={handleSend}
              disabled={loading || (!inputText.trim() && !imageFile)}
              sx={{ 
                color: "white",
                bgcolor: "#00897b",
                "&:hover": { bgcolor: "#00695c" },
                "&:disabled": { bgcolor: "rgba(0, 137, 123, 0.5)" }
              }}
            >
              <MdSend size={24} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}