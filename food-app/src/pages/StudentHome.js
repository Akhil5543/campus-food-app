// pages/StudentHome.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const StudentHome = () => {
  const navigate = useNavigate();

  // Get name from JWT token
  const token = localStorage.getItem("token");
  let studentName = "Student";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      studentName = decoded.name || "Student";
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="container mt-5 text-center">
      <h2>👋 Welcome {studentName}!</h2>
      <p>You have successfully logged in.</p>
      <button className="btn btn-danger mt-3" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default StudentHome;
