import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../AuthPages.css";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.post("https://auth-service-fgt8.onrender.com/reset-password", {
        email,
        code,
        newPassword,
      });

      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000); // Redirect after 2 seconds
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-header">Reset Password</h2>
      <p className="auth-subtext">Enter your code and set a new password</p>

      <form onSubmit={handleResetPassword}>
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="text"
          placeholder="Enter Reset Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="auth-input"
        />
        <button type="submit" className="auth-button">
          Reset Password
        </button>
      </form>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="auth-link">
        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
};

export default ResetPassword;
