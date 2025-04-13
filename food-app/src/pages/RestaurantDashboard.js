import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./RestaurantDashboard.css";

const socket = io("http://localhost:4002");

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", description: "" });

  const token = localStorage.getItem("token");
  let ownerId = null;

  try {
    const decoded = jwtDecode(token);
    ownerId = decoded.ownerId;
  } catch (err) {
    console.error("Invalid token");
    navigate("/login");
  }

  const fetchVendor = async () => {
    try {
      const res = await axios.get(`http://localhost:4003/vendor/owner/${ownerId}`);
      setVendor(res.data);
    } catch (err) {
      console.error("Error fetching vendor:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      if (!vendor?._id) return;
      const res = await axios.get(`http://localhost:4002/orders/vendor/${vendor._id}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`http://localhost:4002/orders/${orderId}/status`, {
        status: newStatus,
      });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const markItemOutOfStock = async (itemId) => {
    try {
      await axios.put(`http://localhost:4003/vendor/${vendor._id}/menu/${itemId}/out-of-stock`, {
        outOfStock: true,
      });
      fetchVendor(); // Refresh the menu to reflect the changes
    } catch (err) {
      console.error("Error marking item as out of stock:", err);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.description) return;
    try {
      await axios.post(`http://localhost:4003/vendor/${vendor._id}/menu`, newItem);
      setNewItem({ name: "", price: "", description: "" });
      fetchVendor();
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    fetchVendor();
  }, []);

  useEffect(() => {
    if (vendor) {
      fetchOrders();
    }
  }, [vendor]);

  useEffect(() => {
    socket.on("refreshVendorOrders", fetchOrders);
    return () => socket.off("refreshVendorOrders");
  }, []);

  return (
    <div className="restaurant-dashboard">
      <div className="header">
        <h2>🍟 Welcome, {vendor?.name}</h2>
        <p>Manage your menu and view customer orders in real time.</p>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <h3>📋 Your Menu</h3>
      <ul className="menu-list">
        {vendor?.menu?.map((item, index) => (
          <li key={index}>
            <strong>{item.name}</strong>: ${item.price} – {item.description}
            <button 
              className="mark-out-of-stock-btn" 
              onClick={() => markItemOutOfStock(item._id)}>
                {item.outOfStock ? "Out of Stock" : "Mark Out of Stock"}
            </button>
          </li>
        ))}
      </ul>

      <div className="item-form">
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newItem.description}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
        />
        <button onClick={handleAddItem}>Add Item</button>
      </div>

      <h3>📦 Current Orders</h3>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="order-card">
            <p><strong>Order #{order._id}</strong></p>
            <p>Status: <span className="status">{order.status}</span></p>
            <p>Total: ${order.totalAmount}</p>
            <ul>
              {order.items.map((item, idx) => (
                <li key={idx}>{item.name} × {item.quantity}</li>
              ))}
            </ul>
            <div className="button-group">
              <button className="btn yellow" onClick={() => updateOrderStatus(order._id, "Preparing")}>
                Getting Ready
              </button>
              <button className="btn black" onClick={() => updateOrderStatus(order._id, "Delivered")}>
                Order Delivered
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RestaurantDashboard;

