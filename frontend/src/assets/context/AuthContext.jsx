import { createContext, useContext, useEffect, useState } from "react";
import { checkAuthStatus, loginUser } from "../../helpers/api-communicator";

const AuthContext = createContext(null);

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
    await logoutUser();
    setIsLoggedIn(false);
    setUser(null);
    window.location.reload();
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
