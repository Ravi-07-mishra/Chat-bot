import React from 'react';
import { Box, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import CustomizedInput from '../components/shared/CustomizedInput';
import { RiLoginCircleFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../assets/context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      toast.loading('Signing in...', { id: 'login' });
      await auth.login(email, password);
      toast.success('Signed in Successfully', { id: 'login' });
      navigate('/chat');
    } catch (error) {
      toast.error('Signing failed. Please try again.', { id: 'login' });
      console.error('Login error:', error);
    }
  };

  return (
    <Box
      width="100%"
      minHeight="100vh"
      display="flex"
      flexDirection={{ xs: 'column', md: 'row' }}
      alignItems="center"
      justifyContent="center"
      p={2}
      sx={{ backgroundColor: '#0a0a0a' }}
    >
      <Box
        display={{ xs: 'none', md: 'flex' }}
        justifyContent="center"
        alignItems="center"
        flex={1}
        p={4}
      >
        <img
          src="/airobot.png"
          alt="AI Robot"
          style={{ width: '100%', maxWidth: 400, height: 'auto' }}
        />
      </Box>

      <Box
        display="flex"
        flex={1}
        justifyContent="center"
        alignItems="center"
        mt={{ xs: 4, md: 0 }}
        width="100%"
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            borderRadius: 2,
            backgroundColor: '#121212',
          }}
        >
          <Typography variant="h4" textAlign="center" mb={3} fontWeight={600}>
            Login
          </Typography>
          <CustomizedInput type="email" name="email" label="Email" fullWidth />
          <Box my={2} />
          <CustomizedInput type="password" name="password" label="Password" fullWidth />
          <Button
            type="submit"
            fullWidth
            sx={{ mt: 3, py: 1.5, borderRadius: 2, bgcolor: '#00fffc',
              ':hover': { bgcolor: 'white', color: 'black' } }}
            endIcon={<RiLoginCircleFill />}
          >
            Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;