import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, signupUser, checkAuthStatus, sendOtp } from "../../helpers/api-communicator";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const verifyAuthStatus = async () => {
    setIsLoading(true);
    try {
      const data = await checkAuthStatus();
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
    } catch (error) {
      if (error.message === "Not authenticated" || error.response?.status === 401) {
        setIsLoggedIn(false);
        ['bot_token', 'auth_token'].forEach(name => {
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        });
      }
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const publicRoutes = ["/login", "/signup"];
    if (!publicRoutes.includes(location.pathname)) {
      verifyAuthStatus();
    } else {
      setIsLoggedIn(false);  // ✅ FIXED: Set false explicitly
      setIsLoading(false);
    }
  }, [location.pathname]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await loginUser(email, password);
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
      navigate("/chat", { replace: true });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name, email, password, otp) => {
    setIsLoading(true);
    try {
      const data = await signupUser(name, email, password, otp);
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
      navigate("/chat", { replace: true });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtpToEmail = async (email) => {
    setIsLoading(true);
    try {
      await sendOtp(email);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/user/logout");
      setUser(null);
      setIsLoggedIn(false);
      ['bot_token', 'auth_token'].forEach(name => {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      });
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        login,
        signup,
        sendOtp: sendOtpToEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
