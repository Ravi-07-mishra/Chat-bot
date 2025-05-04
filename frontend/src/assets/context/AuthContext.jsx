import { createContext, useContext, useEffect, useState } from "react";
import { checkAuthStatus, loginUser, signupUser } from "../../helpers/api-communicator";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check authentication status on component mount (i.e., page load)
  useEffect(() => {
    async function checkStatus() {
      const data = await checkAuthStatus();
      if (data) {
        setUser({ email: data.email, name: data.name });
        setIsLoggedIn(true);
        // Redirect to the chat page if logged in
        navigate("/chat");
      }
    }
    checkStatus();
  }, [navigate]);

  // Log user information and login status whenever they change
  useEffect(() => {
    console.log("User Context Updated:", { user, isLoggedIn });
  }, [user, isLoggedIn]); // Will run whenever user or isLoggedIn changes

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    if (data) {
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
      navigate("/chat"); // Redirect to chat page after successful login
    }
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    if (data) {
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
      navigate("/chat"); // Redirect to chat page after successful signup
    }
  };

  const logout = async () => {
    try {
      const res = await axios.post("/user/logout", {}, { withCredentials: true });

      if (res.status === 200) {
        // Clear local storage and reset user
        localStorage.removeItem("bot_token");
        setIsLoggedIn(false);
        setUser(null);

        // Navigate to login page after successful logout
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  const value = {
    user,
    isLoggedIn,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Use named export
export const useAuth = () => useContext(AuthContext);
