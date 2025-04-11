import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../AuthPages.css";

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.post("http://localhost:4006/signup", formData);

      const res = await axios.post("http://localhost:4006/login", {
        email: formData.email,
        password: formData.password,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);

      if (decoded.role === "student") navigate("/campus-food-app");
      else navigate("/restaurant-dashboard");
    } catch (err) {
      setError("Signup failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">UM</div>
      <h2 className="auth-header">Create Your Account</h2>
      <p className="auth-subtext">Start your campus food journey with us</p>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="auth-input"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="auth-input"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="auth-input"
        />
        <select name="role" value={formData.role} onChange={handleChange} className="auth-input">
          <option value="student">Student</option>
          <option value="restaurant">Restaurant Owner</option>
        </select>
        <button type="submit" className="auth-button">Sign Up</button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <div className="auth-link">
        Already have an account? <a href="/login">Login</a>
      </div>
    </div>
  );
};

export default Signup;
