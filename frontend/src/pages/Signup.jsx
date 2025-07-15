import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  useTheme,
  useMediaQuery,
  CircularProgress
} from "@mui/material";
import { RiLockPasswordFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext";
import toast from "react-hot-toast";

const Signup = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    name: "",
    password: "",
  });

  const validateEmail = (email) => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return "Invalid email format";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Validate all fields
    const newErrors = {
      name: !formData.name.trim() ? "Name is required" : "",
      email: validateEmail(formData.email),
      password: !formData.password ? "Password is required" : "",
    };
    
    setErrors(newErrors);
    
    if (Object.values(newErrors).some(error => error)) {
      return;
    }

    setIsSubmitting(true);
    try {
      toast.loading("Creating account...", { id: "signup" });
      await auth.signup(
        formData.name.trim(), 
        formData.email.trim(), 
        formData.password
      );
      toast.success("Signed up successfully!", { id: "signup" });
      navigate("/chat");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Signup failed", { id: "signup" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#0a0a0a", py: 4, display: "flex", alignItems: "center" }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", gap: 4 }}>
          {isMdUp && (
            <Box flex={1} textAlign="center">
              <img src="airobot.png" alt="Robot" style={{ maxWidth: 400, width: "100%" }} />
            </Box>
          )}

          <Box flex={1}>
            <Paper
              component="form"
              onSubmit={handleSubmit}
              sx={{ p: 4, boxShadow: 3, borderRadius: 2, backgroundColor: "#121212" }}
            >
              <Typography variant="h4" align="center" gutterBottom color="white">
                Create Account
              </Typography>

              <TextField
                fullWidth
                label="Name"
                variant="outlined"
                value={formData.name}
                onChange={(e) => {
                  setFormData({...formData, name: e.target.value});
                  setErrors({...errors, name: ""});
                }}
                autoFocus
                disabled={isSubmitting}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
                InputProps={{
                  style: { color: 'white' }
                }}
                InputLabelProps={{
                  style: { color: '#aaa' }
                }}
                FormHelperTextProps={{
                  style: { color: '#f44336' }
                }}
              />
              
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value});
                  setErrors({...errors, email: ""});
                }}
                disabled={isSubmitting}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: 2 }}
                InputProps={{
                  style: { color: 'white' }
                }}
                InputLabelProps={{
                  style: { color: '#aaa' }
                }}
                FormHelperTextProps={{
                  style: { color: '#f44336' }
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({...formData, password: e.target.value});
                  setErrors({...errors, password: ""});
                }}
                disabled={isSubmitting}
                error={!!errors.password}
                helperText={errors.password || "Must be at least 8 characters"}
                sx={{ mb: 2 }}
                InputProps={{
                  style: { color: 'white' }
                }}
                InputLabelProps={{
                  style: { color: '#aaa' }
                }}
                FormHelperTextProps={{
                  style: { color: errors.password ? '#f44336' : '#aaa' }
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <RiLockPasswordFill />}
                disabled={isSubmitting}
                sx={{
                  mt: 3,
                  bgcolor: "#00fffc",
                  color: "black",
                  ":hover": { bgcolor: "#ffffff" },
                  "&:disabled": { bgcolor: "#666" }
                }}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;