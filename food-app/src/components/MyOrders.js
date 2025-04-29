import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./MyOrders.css";

const getVendorLogo = (name) => {
  if (!name) return "/images/default-logo.png";
  const formatted = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `/images/${formatted}.png`;
};

const MyOrders = ({ orders }) => {
  const [savedOrders, setSavedOrders] = useState([]);

  // 🔥 Fix: Decode studentId properly
  const token = localStorage.getItem("token") || "";
  let studentId = "";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      studentId = decoded.userId || decoded.id || decoded.sub || "";
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  const saveOrderAsFavorite = async (order) => {
    try {
      await axios.post("https://order-service-vgej.onrender.com/favorite-order", {
        userId: studentId, 
        vendorId: order.restaurantId,
        vendorName: order.restaurantName,
        items: order.items.map((item) => ({
          itemId: item._id || "",
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
      alert("✅ Order saved as Favorite!");
      setSavedOrders((prev) => [...prev, order._id]); 
    } catch (error) {
      console.error("Error saving favorite:", error);
      alert("❌ Failed to save favorite.");
    }
  };

  return (
    <div className="orders-view">
      <h2>Past Orders</h2>
      {orders.length === 0 ? (
        <p>No past orders found.</p>
      ) : (
        orders.map((order, index) => (
          <div key={index} className="order-card">
            <div className="restaurant-info">
              <img
                src={getVendorLogo(order.restaurantName)}
                alt={order.restaurantName}
                className="restaurant-image"
                onError={(e) => (e.target.src = "/images/default-logo.png")}
              />
              <div>
                <strong>{order.restaurantName}</strong>
                <div className="order-meta">
                  {order.items.length} item{order.items.length > 1 ? "s" : ""} for $
                  {order.totalAmount.toFixed(2)} ·{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <ul className="ordered-items">
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>

            <button
              className="favorite-btn"
              onClick={() => saveOrderAsFavorite(order)}
              disabled={savedOrders.includes(order._id)}
            >
              {savedOrders.includes(order._id) ? "✅ Saved" : "❤️ Save to Favorites"}
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
