import { Box, Button, Typography } from "@mui/material";
import React from "react";
import CustomizedInput from "../components/shared/CustomizedInput";
import { RiLoginCircleFill } from "react-icons/ri";
import { useAuth } from "../assets/context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Signup = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const name = formData.get("name");
    const password = formData.get("password");

    try {
      toast.loading("Signing up...", { id: "signup" });
      await auth?.signup(name, email, password);
      toast.success("Signed up successfully!", { id: "signup" });
      navigate("/dashboard");
    } catch (error) {
      toast.error("Signup failed. Please try again.", { id: "signup" });
      console.error(error);
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
      {/* Image Section - hidden on small screens */}
      <Box
        display={{ xs: "none", sm: "none", md: "flex" }}
        justifyContent="center"
        alignItems="center"
        p={4}
      >
        <img src="airobot.png" alt="Robot" style={{ width: "100%", maxWidth: "400px", height: "auto" }} />
      </Box>

      {/* Form Section */}
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
            margin: "auto",
            padding: "30px",
            boxShadow: "10px 10px 20px #000",
            borderRadius: "10px",
            border: "none",
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "#121212",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h4"
              textAlign="center"
              padding={2}
              fontWeight={600}
            >
              Signup
            </Typography>
            <CustomizedInput type="text" name="name" label="Name" />
            <br />
            <CustomizedInput type="email" name="email" label="Email" />
            <br />
            <CustomizedInput type="password" name="password" label="Password" />
            <Button
              type="submit"
              sx={{
                px: 2,
                py: 1,
                mt: 2,
                width: "100%",
                borderRadius: 2,
                bgcolor: "#00fffc",
                ":hover": {
                  bgcolor: "white",
                  color: "black",
                },
              }}
              endIcon={<RiLoginCircleFill />}
            >
              Signup
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
};

export default Signup;
