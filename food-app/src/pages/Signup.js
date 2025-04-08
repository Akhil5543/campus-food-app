// src/pages/Signup.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post("http://localhost:4006/signup", formData);

      const loginRes = await axios.post("http://localhost:4006/login", {
        email: formData.email,
        password: formData.password,
      });

      const token = loginRes.data.token;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      if (decoded.role === "student") {
        navigate("/campus-food-app");
      } else {
        navigate("/restaurant-dashboard");
      }
    } catch (err) {
      console.error("Signup/Login failed:", err);
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="d-flex justify-content-center mb-3">
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
            style={{ width: 80, height: 80, fontSize: 24, fontWeight: "bold" }}
          >
            CE
          </div>
        </div>

        <h3 className="text-center mb-2">Join Campus Eats</h3>
        <p className="text-center text-muted mb-3">Sign up to get started</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            className="form-control mb-2"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            className="form-control mb-2"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            className="form-control mb-2"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <select
            name="role"
            className="form-select mb-3"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="student">Student</option>
            <option value="restaurant">Restaurant Owner</option>
          </select>

          <button type="submit" className="btn btn-primary w-100">
            Sign Up
          </button>
        </form>

        <p className="text-center mt-3" style={{ fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <span
            style={{ color: "#4c6ef5", cursor: "pointer" }}
            onClick={() => navigate("/login")}
          >
            Log In
          </span>
        </p>

        <p className="text-center text-muted mt-4" style={{ fontSize: "0.8rem" }}>
          © 2025 Campus Eats. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Signup;
