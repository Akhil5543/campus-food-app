// src/pages/Login.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:4006/login", { email, password });
      localStorage.setItem("token", res.data.token);
      const decoded = jwtDecode(res.data.token);
      if (decoded.role === "student") {
        navigate("/campus-food-app");
      } else if (decoded.role === "restaurant") {
        navigate("/restaurant-dashboard");
      }
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="d-flex justify-content-center mb-3">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
            style={{ width: 80, height: 80, fontSize: 24, fontWeight: "bold" }}
          >
            CE
          </div>
        </div>
        <h3 className="text-center mb-2">Welcome Back!</h3>
        <p className="text-center text-muted mb-3">Order from your favorite campus spots</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="form-control my-2"
            placeholder="Student Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control my-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary w-100 mt-2" type="submit">
            Login
          </button>
        </form>

        <p className="text-center mt-3" style={{ fontSize: "0.9rem" }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{ color: "#4c6ef5", cursor: "pointer" }}
          >
            Sign Up
          </span>
        </p>

        <p className="text-center text-muted mt-4" style={{ fontSize: "0.8rem" }}>
          Campus ID Single Sign-On Available
        </p>
      </div>
    </div>
  );
};

export default Login;
