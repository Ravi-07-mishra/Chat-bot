import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import CustomizedInput from '../components/shared/CustomizedInput';
import { RiLoginCircleFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../assets/context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      toast.loading("Signing in", { id: "login" });
      await auth?.login(email, password);
      toast.success("Signed in Successfully", { id: "login" });
      navigate('/chat');
    } catch (error) {
      toast.error("Signing failed", { id: "login" });
      console.error("Login error:", error);
    }
  };

  return (
    <Box
      width="100%"
      minHeight="100vh"
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      alignItems="center"
      justifyContent="center"
      p={2}
      sx={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Image Box (hidden on small screens) */}
      <Box
        display={{ xs: "none", sm: "none", md: "flex" }}
        justifyContent="center"
        alignItems="center"
        p={4}
        maxWidth="100%"
      >
        <img
          src="airobot.png"
          alt="Robot"
          style={{ width: "100%", maxWidth: "400px", height: "auto" }}
        />
      </Box>

      {/* Form Box */}
      <Box
        display="flex"
        flex={1}
        justifyContent="center"
        alignItems="center"
        mt={{ xs: 4, md: 8 }}
        width="100%"
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: "400px",
            margin: "auto",
            padding: "30px",
            boxShadow: "10px 10px 20px #000",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#121212",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Typography variant="h4" textAlign="center" padding={2} fontWeight={600}>
              Login
            </Typography>
            <CustomizedInput type="email" name="email" label="Email" />
            <br />
            <CustomizedInput type="password" name="password" label="Password" />
            <Button
              type="submit"
              fullWidth
              sx={{
                px: 2,
                py: 1,
                mt: 2,
                borderRadius: 2,
                bgcolor: "#00fffc",
                ":hover": { bgcolor: "white", color: "black" },
              }}
              endIcon={<RiLoginCircleFill />}
            >
              Login
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default Login;
