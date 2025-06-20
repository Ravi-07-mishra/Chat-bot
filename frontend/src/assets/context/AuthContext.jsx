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
    } catch {
      // If 401, simply clear state (server cleared cookie on a previous logout)
      setUser(null);
      setLogged(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial auth check and route change handler
  useEffect(() => {
    const publicRoutes = ["/login", "/signup"];
    if (publicRoutes.includes(location.pathname)) {
      setLogged(false);
      setIsLoading(false);
    } else {
      verifyAuthStatus();
    }
  }, [location.pathname]);

  // Login handler
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await loginUser(email, password);
      setUser({ email: data.email, name: data.name });
      setLogged(true);
      navigate("/chat", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Signup handler
  const signup = async (name, email, password) => {
    setIsLoading(true);
    try {
      const data = await signupUser(name, email, password);
      setUser({ email: data.email, name: data.name });
      setLogged(true);
      navigate("/chat", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/user/logout"); // withCredentials is automatic
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      // Clear local state; server has cleared the HttpOnly cookie
      setUser(null);
      setLogged(false);
      setIsLoading(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
