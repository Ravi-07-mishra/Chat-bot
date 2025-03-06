import { Box, Button, Typography } from "@mui/material";
import React from "react";
import CustomizedInput from "../components/shared/CustomizedInput";
import { RiLoginCircleFill } from "react-icons/ri";
import axios from "axios";
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
      await auth?.signup(name, email, password); // Pass name if needed
      toast.success("Signed up successfully!", { id: "signup" });
      navigate("/dashboard"); // Redirect after successful signup
    } catch (error) {
      toast.error("Signup failed. Please try again.", { id: "signup" });
      console.error(error);
    }
  };

  return (
    <Box width="100%" height="100%" display="flex" flex="1">
      <Box
        padding={8}
        mt={8}
        display={{ md: "flex", sm: "none", xs: "none" }}
      >
        <img src="airobot.png" alt="Robot" style={{ width: "400px" }} />
      </Box>
      <Box
        display="flex"
        flex={{ xs: 1, md: 0.5 }}
        justifyContent="center"
        alignItems="center"
        padding={2}
        ml="auto"
        mt={16}
      >
        <form
          style={{
            margin: "auto",
            padding: "30px",
            boxShadow: "10px 10px 20px #000",
            borderRadius: "10px",
            border: "none",
            maxWidth: "400px",
            width: "100%",
          }}
          onSubmit={handleSubmit}
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
