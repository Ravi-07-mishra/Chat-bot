import React, { useCallback, lazy, Suspense, useState } from "react";
import { 
  Avatar, Box, Typography, Paper, useTheme, useMediaQuery, Link,
  IconButton, Collapse, Badge
} from "@mui/material";
import { deepPurple, indigo, grey } from "@mui/material/colors";
import { useAuth } from "../../assets/context/AuthContext";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ExpandIcon from '@mui/icons-material/Expand';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';

const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter").then((mod) => ({
    default: mod.Prism,
  }))
);

const Chatitem = ({ message }) => {
  const { content, role, image } = message;
  const auth = useAuth();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isBot = role === "assistant" || role === "assistant-stream";
  const [expanded, setExpanded] = useState(false);

  const formatMessage = useCallback(
    (message) => {
      if (message.includes("```")) {
        const parts = [];
        const segments = message.split("```");
        segments.forEach((seg, i) => {
          if (i % 2 === 0) {
            if (seg.trim()) {
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              if (urlRegex.test(seg)) {
                const textParts = seg.split(urlRegex);
                parts.push(
                  <Typography
                    key={`txt-${i}`}
                    color="#e2e8f0"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      my: 1,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      lineHeight: 1.6
                    }}
                  >
                    {textParts.map((part, j) => {
                      if (part.match(urlRegex)) {
                        return (
                          <Link 
                            key={j} 
                            href={part} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            color="#a5b4fc"
                            sx={{ 
                              wordBreak: 'break-all',
                              textDecoration: 'underline',
                              fontWeight: 500,
                              '&:hover': {
                                color: '#818cf8'
                              }
                            }}
                          >
                            {part}
                          </Link>
                        );
                      }
                      return part;
                    })}
                  </Typography>
                );
              } else {
                parts.push(
                  <Typography
                    key={`txt-${i}`}
                    color="#e2e8f0"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      my: 1,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      lineHeight: 1.6
                    }}
                  >
                    {seg}
                  </Typography>
                );
              }
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
                  my: 2,
                  width: "100%",
                  overflowX: "auto",
                  borderRadius: 1,
                  border: "1px solid rgba(71, 85, 105, 0.5)",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                }}
              >
                <Suspense fallback={
                  <Box sx={{ 
                    bgcolor: "#0f172a", 
                    p: 2, 
                    borderRadius: 1,
                    color: "#94a3b8",
                    fontFamily: 'monospace',
                    fontSize: isSmall ? "0.75rem" : "0.875rem"
                  }}>
                    Loading code...
                  </Box>
                }>
                  <SyntaxHighlighter
                    language={lang}
                    style={coldarkDark}
                    customStyle={{
                      margin: 0,
                      background: "#0f172a",
                      color: "#d6deeb",
                      borderRadius: 4,
                      fontSize: isSmall ? "0.75rem" : "0.875rem",
                      padding: "1rem",
                      border: "1px solid rgba(71, 85, 105, 0.3)"
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
                color="#a5b4fc"
                sx={{ 
                  wordBreak: 'break-all',
                  textDecoration: 'underline',
                  fontWeight: 500,
                  '&:hover': {
                    color: '#818cf8'
                  }
                }}
              >
                {part}
              </Link>
            );
          }
          return (
            <Typography
              key={i}
              component="span"
              color="#e2e8f0"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                lineHeight: 1.6
              }}
            >
              {part}
            </Typography>
          );
        });
      }

      return (
        <Typography
          color="#e2e8f0"
          sx={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            my: 1,
            fontSize: { xs: "0.875rem", sm: "1rem" },
            lineHeight: 1.6
          }}
        >
          {message}
        </Typography>
      );
    },
    [isSmall]
  );

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Box
      sx={{
        display: "flex",
        mb: 2,
        alignItems: "flex-start",
        position: 'relative',
        maxWidth: '100%',
        alignSelf: isBot ? 'flex-start' : 'flex-end',
      }}
    >
      {isBot && (
        <Avatar
          sx={{
            bgcolor: "rgba(99, 102, 241, 0.9)",
            mr: 2,
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            flexShrink: 0,
            mt: 0.5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          <Box 
            component="img" 
            src="/openai.png" 
            alt="bot" 
            sx={{ 
              width: '24px', 
              height: '24px',
              filter: 'invert(1)'
            }} 
          />
        </Avatar>
      )}
      
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          p: { xs: 1.5, sm: 2 },
          bgcolor: isBot ? "rgba(30, 41, 59, 0.8)" : "rgba(30, 41, 59, 0.6)",
          borderRadius: 2.5,
          flex: 1,
          border: "1px solid",
          borderColor: isBot 
            ? "rgba(99, 102, 241, 0.3)" 
            : "rgba(71, 85, 105, 0.3)",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
          maxWidth: { xs: '85%', sm: '90%' },
          flexDirection: 'column'
        }}
      >
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {image && (
            <Box sx={{ mb: 1.5, position: 'relative' }}>
              <Collapse in={expanded} collapsedSize={200}>
                <Box
                  component="img" 
                  src={image} 
                  alt="User uploaded" 
                  sx={{ 
                    width: '100%', 
                    borderRadius: '8px',
                    maxHeight: expanded ? '70vh' : '200px',
                    objectFit: 'contain',
                    cursor: 'pointer',
                    backgroundColor: grey[900],
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    boxSizing: 'border-box'
                  }}
                  onClick={handleToggleExpand}
                />
              </Collapse>
              <IconButton
                size="small"
                onClick={handleToggleExpand}
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  color: '#e2e8f0',
                  backdropFilter: 'blur(4px)',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                  }
                }}
              >
                {expanded ? <CloseFullscreenIcon /> : <ExpandIcon />}
              </IconButton>
            </Box>
          )}
          {content ? (
            formatMessage(content)
          ) : image ? (
            <Typography
              color="#94a3b8"
              sx={{
                fontStyle: 'italic',
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              {isBot ? "Here's what I see in the image:" : "Sent an image"}
            </Typography>
          ) : null}
        </Box>
      </Paper>
      
      {!isBot && (
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: 'rgba(99, 102, 241, 0.9)',
                border: '2px solid #0f172a'
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                U
              </Typography>
            </Avatar>
          }
          sx={{ ml: 1.5 }}
        >
          <Avatar
            sx={{
              bgcolor: "rgba(71, 85, 105, 0.9)",
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              flexShrink: 0,
              mt: 0.5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
            }}
          >
            {auth.user?.name?.[0] || "U"}
          </Avatar>
        </Badge>
      )}
    </Box>
  );
};

export default React.memo(Chatitem);