import React, { useCallback, lazy, Suspense, useState } from "react";
import { 
  Avatar, Box, Typography, Paper, useTheme, useMediaQuery, Link,
  IconButton, Collapse
} from "@mui/material";
import { teal, grey } from "@mui/material/colors";
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
                    color="white"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      my: 1,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
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
                            color={teal[300]}
                            sx={{ wordBreak: 'break-all' }}
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

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

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
        position: 'relative',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isBot ? teal[700] : grey[900],
          mr: 2,
          width: { xs: 32, sm: 40 },
          height: { xs: 32, sm: 40 },
          flexShrink: 0,
        }}
      >
        {isBot ? (
          <img src="/openai.png" alt="bot" width="24" height="24" />
        ) : (
          auth.user?.name?.[0] || "U"
        )}
      </Avatar>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {image && (
          <Box sx={{ mb: 1, position: 'relative' }}>
            <Collapse in={expanded} collapsedSize={200}>
              <img 
                src={image} 
                alt="User uploaded" 
                style={{ 
                  width: '100%', 
                  borderRadius: '8px',
                  maxHeight: expanded ? '70vh' : '200px',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  backgroundColor: grey[900]
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
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
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
            color="white"
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
  );
};

export default React.memo(Chatitem);