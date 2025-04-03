// pages/RestaurantDashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const RestaurantDashboard = () => {
  const navigate = useNavigate();

  // Decode token to get restaurant name
  const token = localStorage.getItem("token");
  let restaurantName = "Restaurant Owner";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      restaurantName = decoded.name || "Restaurant Owner";
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
      <h2>🍽️ Welcome {restaurantName}!</h2>
      <p>You are logged in as a restaurant and can manage your menu/orders.</p>
      <button className="btn btn-danger mt-3" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default RestaurantDashboard;
