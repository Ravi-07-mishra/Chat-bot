import React, { useState } from "react";
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
import { RiMailSendFill, RiLockPasswordFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext";
import toast from "react-hot-toast";

const Signup = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [step, setStep] = useState(1); // 1: Email step, 2: Signup form
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    otp: ""
  });

  const handleSendOtp = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    try {
      toast.loading("Sending OTP...", { id: "otp" });
      await auth.sendOtp(email);
      toast.success("OTP sent to your email!", { id: "otp" });
      setStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP", { id: "otp" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      toast.loading("Creating account...", { id: "signup" });
      await auth.signup(formData.name, email, formData.password, formData.otp);
      toast.success("Signed up successfully!", { id: "signup" });
      navigate("/chat");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Signup failed", { id: "signup" });
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
                  
                  <CustomizedInput 
                    type="email" 
                    name="email" 
                    label="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    endIcon={<RiMailSendFill />}
                    sx={{
                      mt: 3,
                      bgcolor: "#00fffc",
                      color: "black",
                      ":hover": { bgcolor: "#ffffff" },
                    }}
                  >
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="body1" color="#00fffc" align="center" mb={2}>
                    OTP sent to {email}
                  </Typography>
                  
                  <CustomizedInput 
                    type="text" 
                    name="name" 
                    label="Name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    autoFocus
                  />
                  <Box my={2} />
                  
                  <CustomizedInput
                    type="password"
                    name="password"
                    label="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <Box my={2} />
                  
                  <CustomizedInput
                    type="text"
                    name="otp"
                    label="Verification Code"
                    value={formData.otp}
                    onChange={(e) => setFormData({...formData, otp: e.target.value})}
                    inputProps={{ maxLength: 6 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="#aaa"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setStep(1)}
                    >
                      Change email
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="#00fffc"
                      sx={{ cursor: 'pointer' }}
                      onClick={handleSendOtp}
                    >
                      Resend OTP
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    endIcon={<RiLockPasswordFill />}
                    sx={{
                      mt: 3,
                      bgcolor: "#00fffc",
                      color: "black",
                      ":hover": { bgcolor: "#ffffff" },
                    }}
                  >
                    Create Account
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