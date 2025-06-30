import React, { useCallback, lazy, Suspense } from "react";
import { Avatar, Box, Typography, Paper, useTheme, useMediaQuery, Link } from "@mui/material";
import { teal, grey } from "@mui/material/colors";
import { useAuth } from "../../assets/context/AuthContext";

// Lazy-load the syntax highlighter
const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter").then((mod) => ({
    default: mod.Prism,
  }))
);

const Chatitem = ({ content, role }) => {
  const auth = useAuth();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isBot = role === "assistant" || role === "assistant-stream";

  const formatMessage = useCallback(
    (message) => {
      // First check for code blocks
      if (message.includes("```")) {
        const parts = [];
        const segments = message.split("```");
        segments.forEach((seg, i) => {
          if (i % 2 === 0) {
            if (seg.trim()) {
              parts.push(
                <Typography
                  key={`txt-${i}`}
                  color="white"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    my: 1,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                >
                  {seg}
                </Typography>
              );
            }
          } else {
            let lang = "javascript";
            let code = seg;
            const firstLine = seg.split("\n")[0].trim();
            if (firstLine && !firstLine.includes(" ")) {
              lang = firstLine;
              code = seg.split("\n").slice(1).join("\n");
            }

            parts.push(
              <Box
                key={`code-${i}`}
                sx={{
                  my: 1,
                  width: "100%",
                  overflowX: "auto",
                  borderRadius: 1,
                }}
              >
                <Suspense fallback={<Typography sx={{ color: grey[500] }}>Loading code…</Typography>}>
                  <SyntaxHighlighter
                    language={lang}
                    style={coldarkDark}
                    customStyle={{
                      margin: 0,
                      background: "#011627",
                      color: "#d6deeb",
                      borderRadius: 4,
                      fontSize: isSmall ? "0.75rem" : "0.875rem",
                      padding: "1rem",
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </Suspense>
              </Box>
            );
          }
        });
        return parts;
      }

      // Handle URLs in the message (for live data links)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      if (urlRegex.test(message)) {
        const parts = message.split(urlRegex);
        return parts.map((part, i) => {
          if (part.match(urlRegex)) {
            return (
              <Link 
                key={i} 
                href={part} 
                target="_blank" 
                rel="noopener noreferrer"
                color={teal[300]}
                sx={{ wordBreak: 'break-all' }}
              >
                {part}
              </Link>
            );
          }
          return (
            <Typography
              key={i}
              component="span"
              color="white"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              {part}
            </Typography>
          );
        });
      }

      // Default text rendering
      return (
        <Typography
          color="white"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            my: 1,
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          {message}
        </Typography>
      );
    },
    [isSmall]
  );

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        p: { xs: 1, sm: 2 },
        mb: { xs: 0.5, sm: 1 },
        bgcolor: isBot ? "rgba(0,77,86,0.8)" : "rgba(0,77,86,0.1)",
        borderRadius: 2,
        alignItems: "flex-start",
      }}
    >
      <Avatar
        sx={{
          bgcolor: isBot ? teal[700] : grey[900],
          mr: 2,
          width: { xs: 32, sm: 40 },
          height: { xs: 32, sm: 40 },
        }}
      >
        {isBot ? (
          <img src="/gemini_logo.png" alt="bot" width="24" height="24" />
        ) : (
          auth.user?.name?.[0] || "U"
        )}
      </Avatar>
      <Box sx={{ flex: 1 }}>{formatMessage(content)}</Box>
    </Paper>
  );
};

export default React.memo(Chatitem);