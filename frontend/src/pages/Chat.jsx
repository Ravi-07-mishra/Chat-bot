"use client"

import { Avatar, Box, Button, IconButton, Typography, CircularProgress, Snackbar, Alert } from "@mui/material"
import { useRef, useState, useEffect } from "react"
import { useAuth } from "../assets/context/AuthContext"
import { red, teal } from "@mui/material/colors"
import { MdSend, MdDelete } from "react-icons/md"
import Chatitem from "../components/chat/Chatitem"
import { sendGeminiChatRequest } from "../helpers/api-communicator"

import { useNavigate } from "react-router-dom"

const Chat = () => {
  const auth = useAuth()
// Initialize the router
  const inputRef = useRef(null)
  const chatContainerRef = useRef(null)
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!auth?.isLoggedIn) {
      navigate("/login");
    }
  }, [auth?.isLoggedIn, navigate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chats])

  const handleSubmit = async () => {
    const content = inputRef.current?.value?.trim()
    if (!content) return

    if (inputRef && inputRef.current) {
      inputRef.current.value = ""
    }

    const newMessage = { role: "user", content }
    setChats((prev) => [...prev, newMessage])
    setLoading(true)
    setError(null)

    // Send the user message to the Gemini API
    try {
      const chatData = await sendGeminiChatRequest(content)
      setChats((prev) => [...prev, { role: "model", content: chatData }])
    } catch (error) {
      console.error("Error handling chat submission:", error)
      setError("Failed to get response. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const clearConversation = () => {
    setChats([])
  }

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100%",
        mt: 3,
        gap: 3,
        backgroundColor: "rgb(7, 15, 25)",
        borderRadius: 2,
        p: 2,
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          display: { md: "flex", xs: "none", sm: "none" },
          flex: 0.2,
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            height: "70vh",
            bgcolor: "rgb(17,29,39)",
            borderRadius: 3,
            flexDirection: "column",
            mx: 3,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
            },
          }}
        >
          <Avatar
            sx={{
              mx: "auto",
              my: 2,
              bgcolor: teal[700],
              color: "white",
              fontWeight: 700,
              width: 56,
              height: 56,
              fontSize: "1.5rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            {auth?.user?.name ? auth?.user?.name[0] : ""}
            {auth?.user?.name?.split(" ")[1]?.[0] || ""}
          </Avatar>
          <Typography
            sx={{
              mx: "auto",
              fontFamily: "work sans",
              fontSize: "1.2rem",
              fontWeight: 500,
              color: teal[100],
            }}
          >
            You are talking to a ChatBot
          </Typography>
          <Typography
            sx={{
              mx: "auto",
              fontFamily: "work sans",
              my: 4,
              p: 3,
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.6,
            }}
          >
            You can ask questions related to knowledge, business, advice, education, etc. Avoid sharing personal
            information.
          </Typography>
          <Button
            startIcon={<MdDelete />}
            onClick={clearConversation}
            sx={{
              width: "200px",
              my: "auto",
              color: "white",
              fontWeight: "700",
              borderRadius: 3,
              mx: "auto",
              bgcolor: red[400],
              py: 1.2,
              transition: "all 0.2s ease",
              ":hover": {
                bgcolor: red[600],
                transform: "translateY(-2px)",
              },
            }}
          >
            Clear Conversation
          </Button>
        </Box>
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          display: "flex",
          flex: { md: 0.8, xs: 1, sm: 1 },
          flexDirection: "column",
          px: 3,
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
          Model - Gemini Pro
        </Typography>

        {/* Chat Messages */}
        <Box
          ref={chatContainerRef}
          sx={{
            width: "100%",
            height: "60vh",
            borderRadius: 3,
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            overflow: "scroll",
            overflowX: "hidden",
            overflowY: "auto",
            scrollBehavior: "smooth",
            bgcolor: "rgba(17,27,39,0.3)",
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)",
            p: 1,
          }}
        >
          {chats.length === 0 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                opacity: 0.7,
              }}
            >
              <Typography color="white" variant="h6" sx={{ textAlign: "center" }}>
                Start a conversation with Gemini Pro
              </Typography>
              <Typography color="gray" variant="body2" sx={{ textAlign: "center", mt: 1 }}>
                Type a message below to begin
              </Typography>
            </Box>
          )}

          {chats.map((chat, index) => (
            <Chatitem key={index} content={chat.content} role={chat.role} />
          ))}

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
              "&:hover": {
                color: teal[100],
                transform: "scale(1.1)",
              },
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            <MdSend />
          </IconButton>
        </Box>
      </Box>

      {/* Error Snackbar */}
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
  )
}

export default Chat
