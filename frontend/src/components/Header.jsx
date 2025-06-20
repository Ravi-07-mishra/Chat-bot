import { AppBar, Toolbar, Box, Button } from '@mui/material';
import React from 'react';
import Logo from './shared/Logo';
import { useAuth } from '../assets/context/AuthContext';
import NavigationLink from './shared/NavigationLink';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = () => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isOnChatPage = location.pathname === "/chat";

  return (
    <AppBar
      sx={{
        bgcolor: "transparent",
        position: "static",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Logo />
        <Box
          sx={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            width: { xs: "100%", sm: "auto" },
            mt: { xs: 1, sm: 0 },
          }}
        >
          {auth?.isLoggedIn ? (
            <>
              {!isOnChatPage && (
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#00fffc",
                    color: "black",
                    ":hover": { bgcolor: "#ffffff" },
                  }}
                  onClick={() => navigate("/chat")}
                >
                  Go to Chat
                </Button>
              )}
              <button
                style={{
                  backgroundColor: "#51538f",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  cursor: "pointer",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  transition: "background-color 0.3s ease, transform 0.2s ease",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                }}
                onClick={auth.logout}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#42436c";
                  e.target.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#51538f";
                  e.target.style.transform = "scale(1)";
                }}
              >
                Logout
              </button>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
