import { Avatar, Box, Typography, Paper } from "@mui/material";
import { useAuth } from "../../assets/context/AuthContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { teal, grey } from "@mui/material/colors";

const Chatitem = ({ content, role }) => {
  const auth = useAuth();
  const isBot = role === "model" || role === "assistant";

  // Parse and format message with code blocks (using "```")
  const formatMessage = (message) => {
    if (!message) return null;
    if (message.includes("```")) {
      const parts = [];
      const segments = message.split("```");
      segments.forEach((segment, index) => {
        if (index % 2 === 0) {
          if (segment.trim()) {
            parts.push(
              <Typography
                key={`text-${index}`}
                color="white"
                fontSize="18px"
                sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
              >
                {segment}
              </Typography>
            );
          }
        } else {
          let language = "javascript";
          let code = segment;
          const firstLineBreak = segment.indexOf("\n");
          if (firstLineBreak > 0) {
            const possibleLang = segment.substring(0, firstLineBreak).trim();
            if (possibleLang && !possibleLang.includes(" ")) {
              language = possibleLang;
              code = segment.substring(firstLineBreak + 1);
            }
          }
          parts.push(
            <Box key={`code-${index}`} sx={{ my: 2, borderRadius: 2, overflow: "hidden" }}>
              <SyntaxHighlighter
                language={language}
                style={coldarkDark}
                customStyle={{ margin: 0, borderRadius: "8px", fontSize: "16px" }}
              >
                {code}
              </SyntaxHighlighter>
            </Box>
          );
        }
      });
      return parts;
    }

    return (
      <Typography
        color="white"
        fontSize="18px"
        sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
      >
        {message}
      </Typography>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        p: 2,
        bgcolor: isBot ? "rgba(0, 77, 86, 0.8)" : "rgba(0, 77, 86, 0.1)",
        my: 1.5,
        gap: 2,
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: isBot ? "rgba(0, 77, 86, 0.9)" : "rgba(0, 77, 86, 0.2)",
        },
      }}
    >
      <Avatar
        sx={{
          ml: 0,
          bgcolor: isBot ? teal[700] : grey[900],
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        {isBot ? (
          <img src="openai.png" alt="gemini" width="30px" />
        ) : (
          auth?.user?.name?.[0] || ""
        )}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        {formatMessage(content)}
      </Box>
    </Paper>
  );
};

export default Chatitem;
