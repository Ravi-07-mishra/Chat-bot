// Chatitem.jsx
import React from 'react';
import { Avatar, Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { teal, grey } from '@mui/material/colors';
import { useAuth } from '../../assets/context/AuthContext';

const Chatitem = ({ content, role }) => {
  const auth = useAuth();
  const isBot = role === 'model' || role === 'assistant';
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  const formatMessage = (message) => {
    if (!message) return null;
    if (message.includes('```')) {
      const parts = [];
      const segments = message.split('```');
      segments.forEach((segment, index) => {
        if (index % 2 === 0) {
          if (segment.trim()) {
            parts.push(
              <Typography
                key={`text-${index}`}
                color="white"
                fontSize={isSmUp ? '18px' : '16px'}
                sx={{
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {segment}
              </Typography>
            );
          }
        } else {
          let language = 'javascript';
          let code = segment;
          const firstLineBreak = segment.indexOf('\n');
          if (firstLineBreak > 0) {
            const possibleLang = segment.substring(0, firstLineBreak).trim();
            if (possibleLang && !possibleLang.includes(' ')) {
              language = possibleLang;
              code = segment.substring(firstLineBreak + 1);
            }
          }
          parts.push(
            <Box
              key={`code-${index}`}
              sx={{
                my: 2,
                borderRadius: 2,
                overflowX: 'auto',
                maxWidth: '100%',
              }}
            >
              <SyntaxHighlighter
                language={language}
                style={coldarkDark}
                customStyle={{
                  margin: 0,
                  borderRadius: '8px',
                  fontSize: isSmUp ? 16 : 14,
                  minWidth: '100%',
                }}
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
        fontSize={isSmUp ? '18px' : '16px'}
        sx={{
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message}
      </Typography>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        p: 2,
        bgcolor: isBot ? 'rgba(0, 77, 86, 0.8)' : 'rgba(0, 77, 86, 0.1)',
        my: 1.5,
        gap: 2,
        borderRadius: 2,
        transition: 'background 0.2s ease',
        '&:hover': {
          bgcolor: isBot ? 'rgba(0, 77, 86, 0.9)' : 'rgba(0, 77, 86, 0.2)',
        },
        width: '100%',
      }}
    >
      <Avatar
        sx={{
          bgcolor: isBot ? teal[700] : grey[900],
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          alignSelf: { xs: 'flex-start', sm: 'center' },
          width: isSmUp ? 40 : 32,
          height: isSmUp ? 40 : 32,
        }}
      >
        {isBot ? (
          <img src="/openai.png" alt="bot" width={isSmUp ? 30 : 24} />
        ) : (
          auth?.user?.name?.[0] || ''
        )}
      </Avatar>
      <Box sx={{ flex: 1 }}>{formatMessage(content)}</Box>
    </Paper>
  );
};

export default Chatitem;