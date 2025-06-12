import { Avatar, Box, Typography, Paper } from "@mui/material";
import { useAuth } from "../../assets/context/AuthContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { teal, grey } from "@mui/material/colors";

const Chatitem = ({ content, role }) => {
  const auth = useAuth();
  const isBot = role === "assistant" || role === "assistant-stream";

  const formatMessage = (message) => {
    if (message.includes("```")) {
      const parts = [];
      const segments = message.split("```");
      segments.forEach((seg, i) => {
        if (i % 2 === 0) {
          if (seg.trim()) {
            parts.push(
              <Typography
                key={i}
                color="white"
                sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", my: 1 }}
              >
                {seg}
              </Typography>
            );
          }
        } else {
          let lang = "javascript";
          let code = seg;
          const firstLine = seg.split("\n")[0];
          if (firstLine && !firstLine.includes(" ")) {
            lang = firstLine;
            code = seg.split("\n").slice(1).join("\n");
          }
          parts.push(
            <Box key={`code-${i}`} sx={{ my: 1, overflowX: "auto" }}>
              <SyntaxHighlighter
                language={lang}
                style={coldarkDark}
                customStyle={{ margin: 0, borderRadius: 4 }}
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
        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", my: 1 }}
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
        mb: 1,
        bgcolor: isBot ? "rgba(0,77,86,0.8)" : "rgba(0,77,86,0.1)",
        borderRadius: 2,
      }}
    >
      <Avatar sx={{ bgcolor: isBot ? teal[700] : grey[900], mr: 2 }}>
        {isBot ? <img src="/openai.png" alt="bot" width={24} /> : auth.user?.name?.[0]}
      </Avatar>
      <Box sx={{ flex: 1 }}>{formatMessage(content)}</Box>
    </Paper>
  );
};

export default Chatitem;
