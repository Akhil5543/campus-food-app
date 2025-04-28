import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../AuthPages.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("https://auth-service-fgt8.onrender.com/login", {
        email,
        password,
        role,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      if (decoded.role === "student") navigate("/campus-food-app");
      else if (decoded.role === "restaurant") navigate("/restaurant-dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="login-page">
    <div className="background-overlay"></div>
    
    <div className="auth-container">
      <div className="auth-logo">UM</div>
      <h2 className="auth-header">Welcome Back!</h2>
      <p className="auth-subtext">Order from your favorite campus spots</p>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <a href="/forgot-password" className="forgot-password-link">
        Forgot Password?
        </a>    
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="auth-input"
        >
          <option value="student">Student</option>
          <option value="restaurant">Restaurant Owner</option>
        </select>
        <button type="submit" className="auth-button">Login</button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <div className="auth-link">
        Don’t have an account? <a href="/signup">Sign Up</a>
      </div>

      <div className="auth-note">UMBC Campus SSO coming soon</div>
    </div>
  );
};

export default Login;
