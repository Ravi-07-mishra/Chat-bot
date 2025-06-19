import React, { createContext, useContext, useEffect, useState } from "react";
import {
  loginUser,
  signupUser,
  checkAuthStatus,
} from "../../helpers/api-communicator";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setLogged] = useState(null); // null = loading, true/false = known
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ On first load, check if user is authenticated
  useEffect(() => {
    (async () => {
      try {
        const data = await checkAuthStatus();
        setUser({ email: data.email, name: data.name });
        setLogged(true);
      } catch {
        setUser(null);
        setLogged(false);
      }
    })();
  }, []);

  // 🔐 Manual login
  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser({ email: data.email, name: data.name });
    setLogged(true);
    navigate("/chat");
  };

  // 🔐 Manual signup
  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    setUser({ email: data.email, name: data.name });
    setLogged(true);
    navigate("/chat");
  };

  // 🔓 Logout
  const logout = async () => {
    try {
      await api.post("/user/logout");
    } catch (err) {
      console.error("Logout error:", err.message);
    }
    localStorage.removeItem("bot_token");
    setUser(null);
    setLogged(false);

    // Only redirect if not already on login page
    if (location.pathname !== "/login") {
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
