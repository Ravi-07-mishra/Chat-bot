// src/pages/Signup.jsx
import React from "react";
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

const Signup = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = data.get("name");
    const email = data.get("email");
    const password = data.get("password");

    try {
      toast.loading("Signing up...", { id: "signup" });
      await auth.signup(name, email, password);
      toast.success("Signed up successfully!", { id: "signup" });
      navigate("/chat");
    } catch {
      toast.error("Signup failed. Please try again.", { id: "signup" });
    }
  };

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
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                color="white"
              >
                Signup
              </Typography>

              <CustomizedInput type="text" name="name" label="Name" />
              <Box my={2} />
              <CustomizedInput type="email" name="email" label="Email" />
              <Box my={2} />
              <CustomizedInput
                type="password"
                name="password"
                label="Password"
              />

              {/* Primary Signup Button */}
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
                Signup
              </Button>

              {/* Go to Chat Button (same style) */}
              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 2,
                  bgcolor: "#00fffc",
                  color: "black",
                  ":hover": { bgcolor: "#ffffff" },
                }}
                onClick={() => navigate("/chat")}
              >
                Go to Chat
              </Button>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;
