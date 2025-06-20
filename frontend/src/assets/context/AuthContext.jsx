// src/assets/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, signupUser, checkAuthStatus } from "../../helpers/api-communicator";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setLogged] = useState(null); // null = loading, true/false = known
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth status verification
  const verifyAuthStatus = async () => {
    setIsLoading(true);
    try {
      const data = await checkAuthStatus();
      setUser({ email: data.email, name: data.name });
      setLogged(true);
    } catch (err) {
      handleLogout(false); // Silent logout without redirect
    } finally {
      setIsLoading(false);
    }
  };

  // Unified logout handler
  const handleLogout = (shouldRedirect = true) => {
    // Clear frontend state
    setUser(null);
    setLogged(false);
    
    // Clear cookies aggressively
    document.cookie = 'auth_token=; Path=/; Domain=.onrender.com; ' + 
      'Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=None';
    
    if (shouldRedirect && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  };

  // Initial auth check and route change handler
  useEffect(() => {
    const publicRoutes = ["/login", "/signup"];
    
    if (publicRoutes.includes(location.pathname)) {
      setLogged(false);
      setIsLoading(false);
      return;
    }

    verifyAuthStatus();
  }, [location.pathname]);

  // Login handler
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const data = await loginUser(email, password);
      setUser({ email: data.email, name: data.name });
      setLogged(true);
      navigate("/chat", { replace: true });
    } catch (err) {
      throw err; // Let login form handle the error
    } finally {
      setIsLoading(false);
    }
  };

  // Signup handler
  const signup = async (name, email, password) => {
    try {
      setIsLoading(true);
      const data = await signupUser(name, email, password);
      setUser({ email: data.email, name: data.name });
      setLogged(true);
      navigate("/chat", { replace: true });
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post("/user/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      handleLogout();
      window.location.reload(); // Full reset to ensure clean state
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