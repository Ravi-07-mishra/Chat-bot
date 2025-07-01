import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, signupUser, checkAuthStatus } from "../../helpers/api-communicator";
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
      if (error.message === "Not authenticated") {
        setIsLoggedIn(false);
      } else {
        console.error("Auth check error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const publicRoutes = ["/login", "/signup"];
    if (!publicRoutes.includes(location.pathname)) {
      verifyAuthStatus();
    } else {
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

  const signup = async (name, email, password) => {
    setIsLoading(true);
    try {
      const data = await signupUser(name, email, password);
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
      navigate("/chat", { replace: true });
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
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn, 
      isLoading, 
      login, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);