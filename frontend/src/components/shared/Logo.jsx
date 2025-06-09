import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Logo = () => {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <RouterLink to="/">
        <img
          src="/openai.png"
          alt="logo"
          width={isSmUp ? 32 : 24}
          height={isSmUp ? 32 : 24}
        />
      </RouterLink>
      {isSmUp && (
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', textShadow: '1px 1px 6px rgba(0,0,0,0.7)' }}>
          MERN‑GPT
        </Typography>
      )}
    </Box>
  );
};

export default Logo;
