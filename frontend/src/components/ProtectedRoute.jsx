// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../assets/context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn === false) return <Navigate to="/login" />;
  if (isLoggedIn === null) return null; // or a spinner
  return children;
};

export default ProtectedRoute;
