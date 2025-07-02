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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { red, teal, grey } from "@mui/material/colors";
import { 
  MdSend, MdMic, MdUploadFile, MdMenu, 
  MdPause, MdPlayArrow, MdClose
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
  sendChat
} from "../helpers/api-communicator";

export default function Chat() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const auth = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const debounceRef = useRef(null);

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
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [image, setImage] = useState(null);

  // Speech Synthesis States & Handlers
  const [lang, setLang] = useState("en-US");
  const [isPaused, setPaused] = useState(false);

  const handleLangChange = (e) => {
    setLang(e.target.value);
  };

  const handlePauseResume = () => {
    if (!("speechSynthesis" in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  // Speak the latest assistant message
  useEffect(() => {
    const msgs = currentConversation.messages;
    if (msgs.length === 0) return;

    const last = msgs[msgs.length - 1];
    if (last.role === "assistant" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPaused(false);
      const utterance = new SpeechSynthesisUtterance(last.content);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentConversation.messages, lang]);

  // Redirect if not logged in
  useEffect(() => {
    if (auth?.isLoggedIn === false) navigate("/login");
  }, [auth?.isLoggedIn, navigate]);

  // Auto-scroll on new messages or loading
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentConversation.messages, loading]);

  // Load all conversation summaries
  const loadConversationSummaries = async () => {
    setLoadingConversations(true);
    setError(null);
    try {
      const convs = await getConversations();
      setConversationSummaries(convs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load a specific conversation
  const loadConversation = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const convo = await getConversationById(id);
      setCurrentConversation(convo);
      if (!isMdUp) setMobileOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a conversation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    setLoadingConversations(true);
    setError(null);
    try {
      await deleteConversation(id);
      if (currentConversation.conversationId === id) {
        setCurrentConversation({ conversationId: null, messages: [] });
      }
      await loadConversationSummaries();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.match('image.*')) {
    setError('Please select an image file');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setError('Image size should be less than 5MB');
    return;
  }

  setImageFile(file);  // ✅ store actual file for uploading
  setImagePreview(URL.createObjectURL(file)); // ✅ store preview URL for UI display
};


  // Clear selected image
 const clearImage = () => {
  setImageFile(null);
  setImagePreview(null);
  if (fileInputRef.current) fileInputRef.current.value = '';
};


  const handleTextMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    setLoading(true);
    setError(null);

    // Optimistic UI update
    setCurrentConversation(c => ({
      ...c,
      messages: [...c.messages, { role: "user", content: text }]
    }));

    try {
      // only include conversationId when it exists
      const args = { message: text };
      if (currentConversation.conversationId) {
        args.conversationId = currentConversation.conversationId;
      }

      const result = await sendChat(args);

      // Replace messages with server‑authoritative conversation
      setCurrentConversation({
        conversationId: result.conversation.conversationId,
        messages: [...result.conversation.messages]
      });

      await loadConversationSummaries();
    } catch (err) {
      setError(err.message || "Request failed");
      // Roll back optimistic update
      setCurrentConversation(c => ({
        ...c,
        messages: c.messages.slice(0, -1)
      }));
    } finally {
      setLoading(false);
    }
  };


  // Handle file upload with streaming
 const handleFileUpload = () => {
  // 1️⃣ Make sure we actually have a File/Blob
  const file = image;
  if (!(file instanceof Blob)) {
    const msg = "Please select an actual image file to upload.";
    console.error(msg, file);
    setError(msg);
    return;
  }

  const text = inputText.trim();

  // 2️⃣ Clear input & start loading
  setInputText("");
  setLoading(true);
  setError(null);

  // 3️⃣ Optimistic UI: add the user’s image + text
  const userMessage = {
    role: "user",
    content: text,
    image: URL.createObjectURL(file)  // or however you preview it
  };
  setCurrentConversation(c => ({
    ...c,
    messages: [...c.messages, userMessage],
  }));

  // 4️⃣ Stream buffer for assistant
  let buffer = "";

  uploadFile({
    file,               // <- guaranteed to be a Blob/File
    text,              
    // only include if defined
    conversationId: currentConversation.conversationId || undefined,
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
    onDone: (full, convId) => {
      setCurrentConversation(c => ({
        conversationId: convId || c.conversationId,
        messages: [
          ...c.messages.filter(m => m.role !== "assistant-stream"),
          { role: "assistant", content: full }
        ]
      }));
      loadConversationSummaries();
      setLoading(false);
      clearImage();       // reset your image picker state
    },
    onError: (errMsg) => {
      console.error("uploadFile error", errMsg);
      setError(errMsg);
      setLoading(false);
      clearImage();
      // remove the last optimistic user message
      setCurrentConversation(c => ({
        ...c,
        messages: c.messages.slice(0, -1)
      }));
    }
  });
};


  // Send message (handles both text and images)
const handleSend = () => {
  if (imageFile) {
    uploadFile({
      file: imageFile, // ✅ send the actual file
      text,
      conversationId,
      onChunk: handleChunk,
      onDone: handleDone,
      onError: handleError,
    });
  } else {
    handleTextMessage(); // fallback for text-only
  }
};

  // Debounced suggestions fetch
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

  // Web Speech API setup
  useEffect(() => {
    const SpeechAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechAPI) {
      const recog = new SpeechAPI();
      recog.lang = "en-US";
      recog.interimResults = true;
      recog.onresult = (ev) => {
        const t = ev.results[0][0].transcript;
        if (ev.results[0].isFinal) {
          setInputText(t);
          handleSend();
        }
      };
      setSpeechRecognition(recog);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggleSpeech = () => {
    if (!speechRecognition) return;
    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  // Start new conversation
  const startNew = () => {
    setCurrentConversation({ conversationId: null, messages: [] });
    setError(null);
    setImage(null);
    if (!isMdUp) setMobileOpen(false);
  };

  // Initial load
  useEffect(() => {
    if (auth?.isLoggedIn) {
      loadConversationSummaries();
    }
  }, [auth?.isLoggedIn]);

  // Sidebar content
  const sidebarContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: { xs: "100%", md: "30%" },
        pr: { md: 2 },
        p: { xs: 1.5, sm: 2 },
        backgroundColor: "rgb(7, 15, 25)",
        borderRadius: 2,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <Button
        onClick={startNew}
        sx={{
          mb: 2,
          bgcolor: teal[700],
          color: "white",
          borderRadius: 2,
          ":hover": { bgcolor: teal[600] },
        }}
      >
        New Conversation
      </Button>

      {loadingConversations ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: "white" }} />
        </Box>
      ) : conversationSummaries.length === 0 ? (
        <Typography color="white" textAlign="center">
          No conversations found
        </Typography>
      ) : (
        <List sx={{ overflowY: 'auto' }}>
          {conversationSummaries.map((s) => {
            const isActive =
              s.conversationId === currentConversation.conversationId;
            return (
              <ListItem 
                key={s.conversationId}
                onClick={() => loadConversation(s.conversationId)}
                sx={{
                  mb: 1.5,
                  bgcolor: isActive
                    ? "rgba(20,120,130,0.8)"
                    : "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.1)",
                    transform: "scale(1.02)",
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: teal[700],
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
                    noWrap: true
                  }}
                  secondary={s.lastMessage?.content?.substring(0, 30) + (s.lastMessage?.content?.length > 30 ? '...' : '') || "Empty conversation"}
                  secondaryTypographyProps={{ 
                    color: grey[300],
                    noWrap: true
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.conversationId);
                  }}
                  sx={{ color: "rgba(255,255,255,0.5)", ml: 1 }}
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
    <Box sx={{ display: "flex", height: "100vh", bgcolor: 'rgb(7, 15, 25)' }}>
      {/* Drawer for small screens */}
      {!isMdUp && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: "80%",
              boxSizing: "border-box",
              bgcolor: 'rgb(7, 15, 25)'
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
          width: "100%",
          p: { xs: 1.5, sm: 2 },
        }}
      >
        {/* Menu button for small screens */}
        {!isMdUp && (
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ alignSelf: "flex-start", mb: 1, color: teal[300] }}
          >
            <MdMenu size={28} />
          </IconButton>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              fontSize: { xs: 28, md: 40 },
              color: "white",
              fontWeight: 600,
              background: `linear-gradient(90deg, ${teal[300]}, ${teal[100]})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Chat with Gemini
          </Typography>
          {currentConversation.conversationId && (
            <Button
              startIcon={<DeleteIcon />}
              variant="outlined"
              color="error"
              onClick={() => handleDelete(currentConversation.conversationId)}
              disabled={loadingConversations}
              size="small"
            >
              Delete
            </Button>
          )}
        </Box>

        {/* Chat History */}
        <Box
          ref={chatContainerRef}
          sx={{
            width: "100%",
            height: { xs: "50vh", sm: "60vh" },
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
          {error && (
            <Typography color="error" sx={{ p: 1 }}>
              {error}
            </Typography>
          )}
          
          {currentConversation.messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              textAlign: 'center',
              color: grey[400]
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Start a new conversation
              </Typography>
              <Typography>
                Type a message or upload an image to get started
              </Typography>
            </Box>
          ) : (
            currentConversation.messages.map((msg, i) => (
              <Chatitem key={i} message={msg} />
            ))
          )}
          
          {loading && (
            <Box
              sx={{
                display: "flex",
                p: 2,
                bgcolor: "#004d56",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Avatar sx={{ bgcolor: teal[700] }}>
                <img src="/openai.png" alt="gemini" width="24px" />
              </Avatar>
              <CircularProgress size={20} sx={{ color: "white" }} />
            </Box>
          )}
        </Box>

        {/* Image Preview */}
        {image && (
          <Box sx={{ 
            mt: 2, 
            p: 1, 
            bgcolor: 'rgba(255,255,255,0.05)', 
            borderRadius: 2,
            position: 'relative'
          }}>
            <Typography variant="subtitle2" color={grey[300]} sx={{ mb: 1 }}>
              Image Preview
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src={image} 
                alt="Preview" 
                style={{ 
                  height: '60px', 
                  width: '60px',
                  borderRadius: '4px',
                  objectFit: 'cover'
                }} 
              />
              <IconButton
                size="small"
                onClick={clearImage}
                sx={{ ml: 1 }}
              >
                <MdClose color={red[500]} />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Input & Controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: 2,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {/* mic (speech-to-text) */}
          <IconButton onClick={toggleSpeech} sx={{ color: teal[300] }}>
            <MdMic size={28} color={isListening ? red[500] : teal[300]} />
          </IconButton>

          {/* play/pause assistant voice */}
          <IconButton onClick={handlePauseResume} sx={{ color: teal[300] }}>
            {isPaused ? (
              <MdPlayArrow size={28} />
            ) : (
              <MdPause size={28} />
            )}
          </IconButton>

          {/* language selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: grey[300] }}>Language</InputLabel>
            <Select
              value={lang}
              label="Language"
              onChange={handleLangChange}
              sx={{
                color: "white",
                ".MuiOutlinedInput-notchedOutline": { borderColor: grey[700] },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: teal[300] },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: teal[300] },
              }}
            >
              <MenuItem value="en-US">English (US)</MenuItem>
              <MenuItem value="en-GB">English (UK)</MenuItem>
              <MenuItem value="hi-IN">Hindi</MenuItem>
              <MenuItem value="es-ES">Español</MenuItem>
            </Select>
          </FormControl>

          {/* autocomplete/text input */}
          <Autocomplete
            freeSolo
            options={suggestions}
            inputValue={inputText}
            onInputChange={handleInputChange}
            filterOptions={(opts) => opts}
            sx={{
              flex: 1,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 3,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="filled"
                placeholder="Type a message"
                InputProps={{ 
                  ...params.InputProps, 
                  disableUnderline: true,
                  sx: {
                    color: 'white',
                    '&:focus': {
                      borderColor: teal[300]
                    }
                  }
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

          {/* file upload */}
          <IconButton 
            onClick={() => fileInputRef.current.click()} 
            sx={{ color: teal[300] }}
          >
            <MdUploadFile size={28} />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </IconButton>

          {/* send button */}
          <IconButton 
            onClick={handleSend} 
            disabled={loading || (!inputText.trim() && !image)}
            sx={{ color: teal[300] }}
          >
            <MdSend size={28} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}