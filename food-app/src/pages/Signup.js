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
    dob: "",
    phone_number: "",
  });

  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("https://auth-service-fgt8.onrender.com/signup", formData);
      setEmailSent(true);
    } catch (err) {
      setError("Signup failed. Please try again.");
    }
  };

  const handleVerification = async () => {
    try {
      await axios.post("https://auth-service-fgt8.onrender.com/verify", {
        email: formData.email,
        code: verificationCode,
      });

      const res = await axios.post("https://auth-service-fgt8.onrender.com/login", {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      const token = res.data.token;
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);

      if (decoded.role === "student") navigate("/campus-food-app");
      else navigate("/restaurant-dashboard");
    } catch (err) {
      setError("Verification failed. Please check your code.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-logo">UM</div>
      <h2 className="auth-header">Create Your Account</h2>
      <p className="auth-subtext">Start your campus food journey with us</p>

      {!emailSent ? (
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
          <input
            name="dob"
            type="date"
            placeholder="Date of Birth"
            value={formData.dob}
            onChange={handleChange}
            className="auth-input"
          />
          <input
            name="phone_number"
            type="tel"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            className="auth-input"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="auth-input"
          >
            <option value="student">Student</option>
            <option value="restaurant">Restaurant Owner</option>
          </select>
          <button type="submit" className="auth-button">Sign Up</button>
        </form>
      ) : (
        <div>
          <p>We sent a 6-digit code to <strong>{formData.email}</strong>. Enter it below to verify your account.</p>
          <input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="auth-input"
          />
          <button onClick={handleVerification} className="auth-button">Verify Email</button>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <div className="auth-link">
        Already have an account? <a href="/login">Login</a>
      </div>
    </div>
  );
};

export default Signup;
