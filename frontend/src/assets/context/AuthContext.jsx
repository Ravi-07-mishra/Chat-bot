import { createContext, useContext, useEffect, useState } from "react";
import { checkAuthStatus, loginUser ,signupUser} from "../../helpers/api-communicator";
import axios from "axios";
const AuthContext = createContext(null);
import { redirect, useNavigate } from "react-router-dom";
export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status on component mount (i.e., page load)
  useEffect(() => {
    async function checkStatus() {
      const data = await checkAuthStatus();
      if (data) {
        setUser({ email: data.email, name: data.name });
        setIsLoggedIn(true);
      }
    }
    checkStatus();
  }, []);

  // Log user information and login status whenever they change
  useEffect(() => {
    console.log("User Context Updated:", { user, isLoggedIn });
  }, [user, isLoggedIn]); // Will run whenever user or isLoggedIn changes

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    if (data) {
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
    }
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    if (data) {
      setUser({ email: data.email, name: data.name });
      setIsLoggedIn(true);
    }
  };

  const logout = async () => {
    try {
      const res = await axios.post('/user/logout', {}, { withCredentials: true });
  
      if (res.status === 200) {
        // Clear local storage and reset user
        localStorage.removeItem("bot_token");
        setIsLoggedIn(false);
        setUser(null);
  
        // Navigate only after successful logout
        redirect('/login');
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
