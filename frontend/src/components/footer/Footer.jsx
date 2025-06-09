import React from 'react';
import { Box, Typography, Link as MuiLink, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        py: 4,
        mt: 8,
        backgroundColor: 'transparent',
        textAlign: 'center',
      }}
    >
      <Typography variant={isSmUp ? 'h6' : 'body1'}>
        Built with determination by{' '}
        <MuiLink
          component={RouterLink}
          to="https://youtube.com/indiancoders"
          target="_blank"
          rel="noopener"
          underline="hover"
          sx={{ fontWeight: 600 }}
        >
          Ravi Mishra
        </MuiLink>{' '}
        ❤️
      </Typography>
    </Box>
  );
};

export default Footer;
