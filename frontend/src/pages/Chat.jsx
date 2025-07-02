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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
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
  sendChat,
  streamChat,
  uploadFile,
  getSuggestions,
  deleteConversation,
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

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Speech Synthesis States
  const [lang, setLang] = useState("en-US");
  const [isPaused, setPaused] = useState(false);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);

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
  }, [currentConversation.messages, loading]);

  // — Speak assistant messages —
  useEffect(() => {
    const msgs = currentConversation.messages;
    if (msgs.length === 0) return;
    const last = msgs[msgs.length - 1];
    if (last.role === "assistant" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPaused(false);
      const utt = new SpeechSynthesisUtterance(last.content);
      utt.lang = lang;
      window.speechSynthesis.speak(utt);
    }
  }, [currentConversation.messages, lang]);

  // — Load all conversation summaries —
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

  // — Load specific conversation by ID —
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
      }
      await loadConversationSummaries();
    } catch (err) {
      setError(err.message);
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

  // — Send text-only message (fallback) —
 const handleTextMessage = () => {
  const text = inputText.trim();
  if (!text) return;

  setInputText("");
  setLoading(true);
  setError(null);

  // 1) Optimistic UI: append the user message immediately
  setCurrentConversation(c => ({
    ...c,
    messages: [...c.messages, { role: "user", content: text }]
  }));

  let buffer = "";

  // 2) Stream the chat
  streamChat({
    message: text,
    conversationId: currentConversation.conversationId,
    onChunk: (part) => {
      buffer += part;
      setCurrentConversation(c => ({
        ...c,
        // remove any previous streaming placeholder and append new one
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
      setError(errMsg);
      setLoading(false);
      // roll back the optimistic user message
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

      // optimistic UI with image preview
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
          setError(errMsg);
          setLoading(false);
          clearImage();
          // rollback optimistic
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

  const handleLangChange = (e) => {
    setLang(e.target.value);
  };

  const startNew = () => {
    setCurrentConversation({ conversationId: null, messages: [] });
    setError(null);
    clearImage();
    if (!isMdUp) setMobileOpen(false);
  };

  // — Sidebar markup —
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
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress size={24} sx={{ color: "white" }} />
        </Box>
      ) : conversationSummaries.length === 0 ? (
        <Typography color="white" textAlign="center">
          No conversations found
        </Typography>
      ) : (
        <List sx={{ overflowY: "auto" }}>
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
                    noWrap: true,
                  }}
                  secondary={
                    (s.lastMessage?.content?.substring(0, 30) || "") +
                    (s.lastMessage?.content?.length > 30 ? "..." : "")
                  }
                  secondaryTypographyProps={{
                    color: grey[300],
                    noWrap: true,
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
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "rgb(7, 15, 25)" }}>
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
              bgcolor: "rgb(7, 15, 25)",
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
        {/* Menu button */}
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
              onClick={() =>
                handleDelete(currentConversation.conversationId)
              }
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                flexDirection: "column",
                textAlign: "center",
                color: grey[400],
              }}
            >
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
        {imagePreview && (
          <Box
            sx={{
              mt: 2,
              p: 1,
              bgcolor: "rgba(255,255,255,0.05)",
              borderRadius: 2,
position: "relative",
}}
>
<Typography
variant="subtitle2"
color={grey[300]}
sx={{ mb: 1 }}
>
Image Preview
</Typography>
<Box sx={{ display: "flex", alignItems: "center" }}>
<img
src={imagePreview}
alt="Preview"
style={{
height: "60px",
width: "60px",
borderRadius: "4px",
objectFit: "cover",
}}
/>
<IconButton size="small" onClick={clearImage}>
<MdClose color={red[500]} />
</IconButton>
</Box>
</Box>
)}

php-template
Copy code
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
      <IconButton onClick={toggleSpeech} sx={{ color: teal[300] }}>
        <MdMic
          size={28}
          color={isListening ? red[500] : teal[300]}
        />
      </IconButton>

      <IconButton onClick={handlePauseResume} sx={{ color: teal[300] }}>
        {isPaused ? <MdPlayArrow size={28} /> : <MdPause size={28} />}
      </IconButton>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel sx={{ color: grey[300] }}>Language</InputLabel>
        <Select
          value={lang}
          label="Language"
          onChange={handleLangChange}
          sx={{
            color: "white",
            ".MuiOutlinedInput-notchedOutline": {
              borderColor: grey[700],
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: teal[300],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: teal[300],
            },
          }}
        >
          <MenuItem value="en-US">English (US)</MenuItem>
          <MenuItem value="en-GB">English (UK)</MenuItem>
          <MenuItem value="hi-IN">Hindi</MenuItem>
          <MenuItem value="es-ES">Español</MenuItem>
        </Select>
      </FormControl>

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
                color: "white",
                "&:focus": { borderColor: teal[300] },
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

      <IconButton
        onClick={handleSend}
        disabled={loading || (!inputText.trim() && !imageFile)}
        sx={{ color: teal[300] }}
      >
        <MdSend size={28} />
      </IconButton>
    </Box>
  </Box>
</Box>
);
}
