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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Signup API call
      await axios.post("http://localhost:4006/signup", formData);

      // Auto-login after signup
      const loginRes = await axios.post("http://localhost:4006/login", {
        email: formData.email,
        password: formData.password,
      });

      const token = loginRes.data.token;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      if (decoded.role === "student") {
        navigate("/campus-food-app");
      } else if (decoded.role === "restaurant") {
        navigate("/restaurant-dashboard");
      }
    } catch (err) {
      console.error("Signup/Login failed:", err);
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "500px" }}>
      <h2 className="text-center mb-4">Signup</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Name</label>
          <input type="text" name="name" className="form-control" required
            value={formData.name} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label>Email</label>
          <input type="email" name="email" className="form-control" required
            value={formData.email} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input type="password" name="password" className="form-control" required
            value={formData.password} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label>Role</label>
          <select name="role" className="form-control" value={formData.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="restaurant">Restaurant</option>
          </select>
        </div>

        <button type="submit" className="btn btn-success w-100">Signup</button>
      </form>
    </div>
  );
};

export default Signup;
