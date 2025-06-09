import React from 'react';
import { Button, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const NavigationLink = ({ to, bg, text, textColor, onClick }) => {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  
  return (
    <Button
      component={RouterLink}
      to={to}
      onClick={onClick}
      variant="contained"
      size={isSmUp ? 'medium' : 'small'}
      sx={{
        backgroundColor: bg,
        color: textColor,
        textTransform: 'none',
        borderRadius: 1,
        '&:hover': { opacity: 0.9 },
        minWidth: isSmUp ? 120 : 80,
      }}
    >
      {text}
    </Button>
  );
};

export default NavigationLink;