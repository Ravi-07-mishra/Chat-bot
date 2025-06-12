"use client";

import {
  Avatar,
  Box,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
  TextField,
} from "@mui/material";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "../assets/context/AuthContext";
import { red, teal } from "@mui/material/colors";
import { MdSend, MdMic, MdUploadFile } from "react-icons/md";
import Chatitem from "../components/chat/Chatitem";
import { useNavigate } from "react-router-dom";

import {
  getConversations,
  getConversationById,
  sendChatMessage,
  streamChat,
  uploadFile,
  getSuggestions,
} from "../helpers/api-communicator";

const Chat = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const [currentConversation, setCurrentConversation] = useState({
    conversationId: null,
    messages: [],
  });
  const [conversationSummaries, setConversationSummaries] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!auth?.isLoggedIn) navigate("/login");
  }, [auth?.isLoggedIn, navigate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [currentConversation.messages, loading]);

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

  const loadConversation = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const convo = await getConversationById(id);
      setCurrentConversation(convo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleInputChange = async (e) => {
    const txt = e.target.value;
    setInputText(txt);
    if (!txt) {
      setSuggestions([]);
      return;
    }
    try {
      const sug = await getSuggestions(txt);
      setSuggestions(sug);
    } catch {
      setSuggestions([]);
    }
  };

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

  const startNew = () => {
    setCurrentConversation({ conversationId: null, messages: [] });
    setError(null);
  };

  useEffect(() => {
    loadConversationSummaries();
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        height: "100%",
        mt: 3,
        gap: 3,
        backgroundColor: "rgb(7, 15, 25)",
        borderRadius: 2,
        p: { xs: 1.5, sm: 2 },
        maxHeight: "calc(100vh - 64px)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: { xs: "100%", md: "30%" },
          borderRight: { md: "1px solid #333" },
          pr: { md: 2 },
          maxHeight: "100%",
          overflowY: "auto",
          mb: { xs: 2, md: 0 },
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
          conversationSummaries.map((s) => (
            <Box
              key={s.conversationId}
              onClick={() => loadConversation(s.conversationId)}
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
                {(s.lastMessage?.content || "?")[0].toUpperCase()}
              </Avatar>
              <Typography
                variant="body1"
                color="white"
                noWrap
                sx={{ flex: 1, fontWeight: 500, fontSize: "15px" }}
              >
                {s.lastMessage?.content || "Empty conversation"}
              </Typography>
            </Box>
          ))
        )}
      </Box>

      {/* Main Chat Panel */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          px: { xs: 1, sm: 3 },
          width: "100%",
        }}
      >
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

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mt: 2,
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <IconButton onClick={toggleSpeech}>
            <MdMic size={28} color={isListening ? red[500] : teal[300]} />
          </IconButton>

          <TextField
            variant="filled"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !loading) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type a message"
            fullWidth
            InputProps={{
              disableUnderline: true,
            }}
            sx={{
              background: "rgba(255,255,255,0.1)",
              color: "white",
              borderRadius: 3,
            }}
            select={suggestions.length > 0}
            SelectProps={{
              MenuProps: { PaperProps: { sx: { mt: -1 } } },
            }}
          >
            {suggestions.map((s, idx) => (
              <MenuItem
                key={idx}
                value={s}
                onClick={() => {
                  setInputText(s);
                  setSuggestions([]);
                }}
              >
                {s}
              </MenuItem>
            ))}
          </TextField>

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

          <IconButton onClick={handleStream} disabled={loading}>
            <MdSend size={28} color={teal[300]} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
