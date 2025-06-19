import React, { useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CustomizedInput from "../components/shared/CustomizedInput";
import { RiLoginCircleFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  // ✅ Prevent showing login again if already logged in
  useEffect(() => {
    if (auth.isLoggedIn === true) {
      navigate("/chat");
    }
  }, [auth.isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = data.get("email");
    const password = data.get("password");
    try {
      toast.loading("Signing in...", { id: "login" });
      await auth.login(email, password);
      toast.success("Signed in Successfully", { id: "login" });
      // ✅ No need to navigate here, useEffect will handle it
    } catch {
      toast.error("Signing failed", { id: "login" });
    }
  };

  // ⏳ Optional: render nothing if we're checking auth status
  if (auth.isLoggedIn === null) return null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        py: 4,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 4,
          }}
        >
          {isMdUp && (
            <Box flex={1} textAlign="center">
              <img
                src="airobot.png"
                alt="Robot"
                style={{ maxWidth: 400, width: "100%" }}
              />
            </Box>
          )}

          <Box flex={1}>
            <Paper
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 4,
                boxShadow: 3,
                borderRadius: 2,
                backgroundColor: "#121212",
              }}
            >
              <Typography variant="h4" align="center" gutterBottom color="white">
                Login
              </Typography>
              <CustomizedInput type="email" name="email" label="Email" />
              <Box my={2} />
              <CustomizedInput type="password" name="password" label="Password" />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                endIcon={<RiLoginCircleFill />}
                sx={{
                  mt: 3,
                  bgcolor: "#00fffc",
                  color: "black",
                  ":hover": { bgcolor: "#ffffff" },
                }}
              >
                Login
              </Button>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
