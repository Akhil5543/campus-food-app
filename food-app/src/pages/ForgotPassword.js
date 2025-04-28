// src/pages/ForgotPassword.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../AuthPages.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendCode = async () => {
    setMessage("");
    setError("");

    try {
      await axios.post("https://auth-service-fgt8.onrender.com/forgot-password", { email });
      setMessage("✅ A reset code has been sent to your email.");
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1500);
    } catch (err) {
      setError("❌ Could not send reset code. Please check your email.");
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-header">Forgot Password</h2>
      <p className="auth-subtext">Enter your email to receive a reset code</p>

      <input
        type="email"
        placeholder="Registered email"
        className="auth-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleSendCode} className="auth-button">
        Send Reset Code
      </button>

      {message && <p style={{ color: "green", marginTop: "12px" }}>{message}</p>}
      {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}

      <div className="auth-link" style={{ marginTop: "20px" }}>
        <a href="/login">Back to Login</a>
      </div>
    </div>
  );
};

export default ForgotPassword;
