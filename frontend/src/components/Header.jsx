import { AppBar, Toolbar } from '@mui/material'
import React from 'react'
import Logo from './shared/Logo'
import { useAuth } from '../assets/context/AuthContext'
import NavigationLink from './shared/NavigationLink'

const Header = () => {
  const auth = useAuth();
  return (
    <AppBar
      sx={{
        bgcolor: "transparent",
        position: "static",
        boxShadow: "none",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Logo />
        <div style={{ display: "flex", gap: "10px" }}>
          {auth?.isLoggedIn ? (
            <>
              <NavigationLink
                bg="#00fffc"
                to="/chat"
                text="Go to chat"
                textColor="black"
              />
              <NavigationLink
                bg="#51538f"
                to="/"
                text="logout"
                textColor="white"
                OnClick={auth.logout}
              />
            </>
          ) : (
            <>
              <NavigationLink
                bg="#00fffc"
                to="/login"
                text="Login"
                textColor="black"
              />
              <NavigationLink
                bg="#51538f"
                to="/signup"
                text="Signup"
                textColor="white"
              />
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Header;


