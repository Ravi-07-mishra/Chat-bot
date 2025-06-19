import { createContext, useContext, useEffect, useState } from "react";
import React from "react";
import {
  loginUser,
  signupUser,
  checkAuthStatus,
} from "../../helpers/api-communicator";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setLogged] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await checkAuthStatus();
        setUser({ email: data.email, name: data.name });
        setLogged(true);
        navigate("/chat");
      } catch {
        setLogged(false);
      }
    })();
  }, [navigate]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser({ email: data.email, name: data.name });
    setLogged(true);
    navigate("/chat");
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    setUser({ email: data.email, name: data.name });
    setLogged(true);
    navigate("/chat");
  };

  const logout = async () => {
    try {
      await api.post("/user/logout");
    } catch {}
    localStorage.removeItem("bot_token");
    setUser(null);
    setLogged(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);