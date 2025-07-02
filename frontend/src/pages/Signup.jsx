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
import { RiMailSendFill, RiLockPasswordFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext";
import toast from "react-hot-toast";

const Signup = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    otp: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    name: "",
    password: "",
    otp: ""
  });

  const validateEmail = (email) => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) return "Invalid email format";
    return "";
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (isSending) return;
    
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({...errors, email: emailError});
      toast.error(emailError);
      return;
    }

    setIsSending(true);
    try {
      toast.loading("Sending OTP...", { id: "otp" });
      await auth.sendOtp(email.trim());
      toast.success("OTP sent to your email!", { id: "otp" });
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP", { id: "otp" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Validate all fields
    const newErrors = {
      name: !formData.name.trim() ? "Name is required" : "",
      password: !formData.password ? "Password is required" : "",
      otp: !formData.otp.trim() ? "OTP is required" : ""
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
        email.trim(), 
        formData.password, 
        formData.otp.trim()
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
              onSubmit={step === 1 ? handleSendOtp : handleSubmit}
              sx={{ p: 4, boxShadow: 3, borderRadius: 2, backgroundColor: "#121212" }}
            >
              <Typography variant="h4" align="center" gutterBottom color="white">
                {step === 1 ? "Get Started" : "Create Account"}
              </Typography>

              {step === 1 ? (
                <>
                  <Typography variant="body1" color="#aaa" align="center" mb={3}>
                    Enter your email to receive a verification code
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({...errors, email: ""});
                    }}
                    autoFocus
                    disabled={isSending}
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
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    endIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <RiMailSendFill />}
                    disabled={isSending}
                    sx={{
                      mt: 3,
                      bgcolor: "#00fffc",
                      color: "black",
                      ":hover": { bgcolor: "#ffffff" },
                      "&:disabled": { bgcolor: "#666" }
                    }}
                  >
                    {isSending ? "Sending..." : "Send OTP"}
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body1" color="#00fffc" align="center" mb={2}>
                    OTP sent to {email}
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
                    helperText={errors.password}
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
                    label="Verification Code"
                    variant="outlined"
                    value={formData.otp}
                    onChange={(e) => {
                      setFormData({...formData, otp: e.target.value});
                      setErrors({...errors, otp: ""});
                    }}
                    inputProps={{ maxLength: 6 }}
                    disabled={isSubmitting}
                    error={!!errors.otp}
                    helperText={errors.otp}
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
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Button 
                      variant="text"
                      color="secondary"
                      onClick={() => !isSubmitting && setStep(1)}
                      disabled={isSubmitting}
                    >
                      Change email
                    </Button>
                    <Button 
                      variant="text"
                      color="primary"
                      onClick={() => !isSubmitting && handleSendOtp({ preventDefault: () => {} })}
                      disabled={isSubmitting}
                    >
                      Resend OTP
                    </Button>
                  </Box>

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
                </>
              )}
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;