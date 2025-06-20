// src/assets/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from "react";
import { loginUser, signupUser, checkAuthStatus } from "../../helpers/api-communicator";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setLogged] = useState(null); // null = loading, true/false = known
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ On mount, run auth-status check unless on login/signup
  useEffect(() => {
    if (location.pathname === "/login" || location.pathname === "/signup") {
      // skip check on public pages
      setLogged(false);
      return;
    }

    (async () => {
      try {
        const data = await checkAuthStatus();  // sends cookie, expects 200
        setUser({ email: data.email, name: data.name });
        setLogged(true);
      } catch {
        setUser(null);
        setLogged(false);
      }
    })();
  }, [location.pathname]);

  // 🔐 Manual login
  const login = async (email, password) => {
    const data = await loginUser(email, password);  // sets cookie
    setUser({ email: data.email, name: data.name });
    setLogged(true);
    navigate("/chat");
  };

  // 🔐 Manual signup
  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);  // sets cookie
    setUser({ email: data.email, name: data.name });
    setLogged(true);
    navigate("/chat");
  };

  // 🔓 Logout
  const logout = async () => {
    try {
      await api.post("/user/logout"); // clears cookie server‑side
    } catch (err) {
      console.error("Logout error:", err.message);
    }
    setUser(null);
    setLogged(false);

    // redirect to login if not already there
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
