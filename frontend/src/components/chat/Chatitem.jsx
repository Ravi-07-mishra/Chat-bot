import { Avatar, Box, Typography, Paper } from "@mui/material"
import { useAuth } from "../../assets/context/AuthContext"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { teal, grey } from "@mui/material/colors"

const Chatitem = ({ content, role }) => {
  const auth = useAuth()

  // Function to parse and format code blocks
  const formatMessage = (message) => {
    if (!message) return null

    // Check if message contains code blocks
    if (message.includes("```")) {
      const parts = []
      const segments = message.split("```")

      segments.forEach((segment, index) => {
        if (index % 2 === 0) {
          // Text content
          if (segment.trim()) {
            parts.push(
              <Typography
                key={`text-${index}`}
                color="white"
                fontSize={"18px"}
                sx={{
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {segment}
              </Typography>,
            )
          }
        } else {
          // Code block
          let language = "javascript" // Default language
          let code = segment

          // Check if language is specified
          const firstLineBreak = segment.indexOf("\n")
          if (firstLineBreak > 0) {
            const possibleLang = segment.substring(0, firstLineBreak).trim()
            if (possibleLang && !possibleLang.includes(" ")) {
              language = possibleLang
              code = segment.substring(firstLineBreak + 1)
            }
          }

          parts.push(
            <Box key={`code-${index}`} sx={{ my: 2, borderRadius: 2, overflow: "hidden" }}>
              <SyntaxHighlighter
                language={language}
                style={coldarkDark}
                customStyle={{
                  margin: 0,
                  borderRadius: "8px",
                  fontSize: "16px",
                }}
              >
                {code}
              </SyntaxHighlighter>
            </Box>,
          )
        }
      })

      return parts
    }

    // Regular text message
    return (
      <Typography
        color="white"
        fontSize={"18px"}
        sx={{
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {message}
      </Typography>
    )
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        p: 2,
        bgcolor: role === "model" ? "rgba(0, 77, 86, 0.8)" : "rgba(0, 77, 86, 0.1)",
        my: 1.5,
        gap: 2,
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: role === "model" ? "rgba(0, 77, 86, 0.9)" : "rgba(0, 77, 86, 0.2)",
        },
      }}
    >
      <Avatar
        sx={{
          ml: "0",
          bgcolor: role === "model" ? teal[700] : grey[900],
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        {role === "model" ? (
          <img src="openai.png" alt="gemini" width={"30px"} />
        ) : auth?.user?.name ? (
          auth?.user?.name[0]
        ) : (
          ""
        )}
      </Avatar>
      <Box sx={{ flex: 1 }}>{formatMessage(content)}</Box>
    </Paper>
  )
}

export default Chatitem

