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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { red, teal } from "@mui/material/colors";
import { MdSend, MdMic, MdUploadFile, MdMenu, MdPause, MdPlayArrow } from "react-icons/md";
import Chatitem from "../components/chat/Chatitem";
import { useNavigate } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useAuth } from "../assets/context/AuthContext";

import {
  getConversations,
  getConversationById,
  sendChatMessage,
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
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);

  // ─── Speech Synthesis States & Handlers ─────────────────────────────────────
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

  // 🔊 Speak the latest assistant message
  useEffect(() => {
    const msgs = currentConversation.messages;
    if (msgs.length === 0) return;

    const last = msgs[msgs.length - 1];
    if (last.role === "assistant" && "speechSynthesis" in window) {
      // cancel any ongoing speech
      window.speechSynthesis.cancel();
      setPaused(false);

      const utterance = new SpeechSynthesisUtterance(last.content);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentConversation.messages, lang]);

  // ─── Redirect if not logged in ──────────────────────────────────────────────
  useEffect(() => {
    if (!auth?.isLoggedIn) navigate("/login");
  }, [auth?.isLoggedIn, navigate]);

  // ─── Auto‑scroll on new messages or loading ─────────────────────────────────
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [currentConversation.messages, loading]);

  // ─── Load all conversation summaries ────────────────────────────────────────
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

  // ─── Load a specific conversation ───────────────────────────────────────────
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

  // ─── Delete a conversation ─────────────────────────────────────────────────
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

  // ─── Send message (no optimistic UI) ────────────────────────────────────────
  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    setLoading(true);
    setError(null);

    try {
      const convo = await sendChatMessage(
        text,
        currentConversation.conversationId
      );
      setCurrentConversation(convo);
      await loadConversationSummaries();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── SSE streaming helper ──────────────────────────────────────────────────
  const handleStream = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    setLoading(true);

    let buffer = "";
    streamChat({
      message: text,
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
      onDone: (full) => {
        setCurrentConversation((c) => ({
          ...c,
          messages: [
            ...c.messages.filter((m) => m.role !== "assistant-stream"),
            { role: "assistant", content: full },
          ],
        }));
        loadConversationSummaries();
        setLoading(false);
      },
      onError: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
  };

  // ─── File upload + streaming ───────────────────────────────────────────────
  const handleFileUpload = () => {
    const file = fileInputRef.current.files[0];
    if (!file) return;
    setLoading(true);

    let buffer = "";
    uploadFile({
      file,
      text: inputText.trim(),
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
      onDone: (full) => {
        setCurrentConversation((c) => ({
          ...c,
          messages: [
            ...c.messages.filter((m) => m.role !== "assistant-stream"),
            { role: "assistant", content: full },
          ],
        }));
        loadConversationSummaries();
        setLoading(false);
      },
      onError: (err) => {
        setError(err.message);
        setLoading(false);
      },
    });
  };

  // ─── Debounced suggestions fetch ───────────────────────────────────────────
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

  // ─── Web Speech API setup (empty deps to avoid loops) ─────────────────────
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
          handleSubmit();
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

  // ─── New conversation ──────────────────────────────────────────────────────
  const startNew = () => {
    setCurrentConversation({ conversationId: null, messages: [] });
    setError(null);
    if (!isMdUp) setMobileOpen(false);
  };

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadConversationSummaries();
  }, []);

  // ─── Sidebar content ───────────────────────────────────────────────────────
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
        <CircularProgress size={24} sx={{ color: "white" }} />
      ) : conversationSummaries.length === 0 ? (
        <Typography color="white">No conversations found</Typography>
      ) : (
        conversationSummaries.map((s) => {
          const isActive =
            s.conversationId === currentConversation.conversationId;
          return (
            <Box
              key={s.conversationId}
              onClick={() => loadConversation(s.conversationId)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
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
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: teal[700],
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {(s.lastMessage?.content || "?")[0].toUpperCase()}
              </Avatar>
              <Typography
                variant="body1"
                color="white"
                noWrap
                sx={{ flex: 1, fontWeight: 500, fontSize: 15 }}
              >
                {s.lastMessage?.content || "Empty conversation"}
              </Typography>
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
            </Box>
          );
        })
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
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
          backgroundColor: "rgb(7, 15, 25)",
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
            Chat with Gemini Pro
          </Typography>
          {currentConversation.conversationId && (
            <Button
              startIcon={<DeleteIcon />}
              color="error"
              onClick={() =>
                handleDelete(currentConversation.conversationId)
              }
              disabled={loadingConversations}
            >
              Delete this chat
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
          {currentConversation.messages.map((msg, i) => (
            <Chatitem key={i} content={msg.content} role={msg.role} />
          ))}
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
              <Avatar>
                <img src="/openai.png" alt="gemini" width="30px" />
              </Avatar>
              <CircularProgress size={20} sx={{ color: "white" }} />
            </Box>
          )}
        </Box>

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
          <IconButton onClick={toggleSpeech}>
            <MdMic size={28} color={isListening ? red[500] : teal[300]} />
          </IconButton>

          {/* play/pause assistant voice */}
          <IconButton onClick={handlePauseResume}>
            {isPaused ? (
              <MdPlayArrow size={28} color={teal[300]} />
            ) : (
              <MdPause size={28} color={teal[300]} />
            )}
          </IconButton>

          {/* language selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: "white" }}>Language</InputLabel>
            <Select
              value={lang}
              label="Language"
              onChange={handleLangChange}
              sx={{
                color: "white",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "white" },
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
                InputProps={{ ...params.InputProps, disableUnderline: true }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            )}
          />

          {/* file upload */}
          <IconButton onClick={() => fileInputRef.current.click()}>
            <MdUploadFile size={28} color={teal[300]} />
            <input
              type="file"
              accept="image/*,text/plain"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
          </IconButton>

          {/* send button */}
          <IconButton onClick={handleSubmit} disabled={loading}>
            <MdSend size={28} color={teal[300]} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
