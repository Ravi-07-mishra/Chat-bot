import React from 'react';
import { useTheme, useMediaQuery, Typography } from '@mui/material';
import { TypeAnimation } from 'react-type-animation';

const TypingAnim = () => {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Typography component="div" sx={{ fontSize: isSmUp ? '2rem' : '1.25rem', color: 'white', textShadow: '1px 1px 6px rgba(0,0,0,0.7)' }}>
      <TypeAnimation
        sequence={['Chat With Your OWN AI', 1000, 'Built With OpenAI 🤖', 2000, 'Your Own Customized ChatGPT 💻', 1500]}
        speed={50}
        repeat={Infinity}
      />
    </Typography>
  );
};

export default TypingAnim;