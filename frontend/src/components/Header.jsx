import React from 'react';
import { AppBar, Toolbar, Box, useTheme, useMediaQuery } from '@mui/material';
import Logo from './shared/Logo';
import { useAuth } from '../assets/context/AuthContext';
import NavigationLink from './shared/NavigationLink';

const Header = () => {
  const auth = useAuth();
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'transparent' }}>
      <Toolbar sx={{ flexDirection: isSmUp ? 'row' : 'column', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Logo />
        <Box sx={{ display: 'flex', gap: 1, mt: isSmUp ? 0 : 2 }}>
          {auth.isLoggedIn ? (
            <NavigationLink to="/" text="Logout" onClick={auth.logout} bg="#51538f" textColor="#fff" />
          ) : (
            <>
              <NavigationLink to="/login" text="Login" bg="#00fffc" textColor="#000" />
              <NavigationLink to="/signup" text="Signup" bg="#51538f" textColor="#fff" />
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
