import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);

    // ✅ Optional expiry check
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem("token");
      return <Navigate to="/login" />;
    }

    // ✅ Role-based access
    if (allowedRoles.includes(decoded.role)) {
      return children;
    } else {
      return <Navigate to="/login" />;
    }
  } catch (err) {
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;
