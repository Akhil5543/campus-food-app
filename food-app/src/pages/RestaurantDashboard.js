import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./RestaurantDashboard.css";

const socket = io("https://order-service-vgej.onrender.com");

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", description: "" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [selectedDate, setSelectedDate] = useState('');
  const sidebarRef = useRef();

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
      const res = await axios.get(`https://vendor-service-wnkw.onrender.com/vendor/owner/${ownerId}`);
      setVendor(res.data);
    } catch (err) {
      console.error("Error fetching vendor:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      if (!vendor?._id) return;
      const res = await axios.get(`https://order-service-vgej.onrender.com/orders/vendor/${vendor._id}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`https://order-service-vgej.onrender.com/orders/${orderId}/status`, {
        status: newStatus
      });
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const toggleItemStock = async (itemId, currentStatus) => {
    try {
      await axios.put(`https://vendor-service-wnkw.onrender.com/vendor/${vendor._id}/menu/${itemId}/out-of-stock`, {
        outOfStock: !currentStatus,
      });
      fetchVendor();
    } catch (err) {
      console.error("Error updating item stock status:", err);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.description) return;
    try {
      await axios.post(`https://vendor-service-wnkw.onrender.com/vendor/${vendor._id}/menu`, newItem);
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
    if (vendor && vendor._id) {
      fetchOrders();
    }
  }, [vendor]);

  useEffect(() => {
    socket.on("refreshVendorOrders", fetchOrders);
    return () => socket.off("refreshVendorOrders", fetchOrders);
  }, []);
  
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      setSidebarOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [sidebarOpen]);

const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };


  return (
    <div className="dashboard-container">
    <div className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</div>
  
    <div ref={sidebarRef} className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-links">
        <button className={activeTab === "menu" ? "active" : ""} onClick={() => setActiveTab("menu")}>🍔 Menu</button>
        <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>📦 Orders</button>
        <button onClick={handleLogout}>🔓 Logout</button>
      </div>
    </div>
     
      <div className={`main-content ${sidebarOpen ? "shifted" : ""}`}>
        <div className="header">
          <h2>🍟 Welcome, {vendor?.name}</h2>
          <p>Manage your menu and view customer orders in real time.</p>
        </div>

        {activeTab === "menu" && (
          <>
            <h3>📋 Your Menu</h3>
            <ul className="menu-list">
              {vendor?.menu?.map((item, index) => (
                <li key={index}>
                  <strong>{capitalizeWords(item.name)}</strong>: ${item.price} – {item.description}
                  <button
                    className={`mark-out-of-stock-btn ${item.outOfStock ? "disabled" : ""}`}
                    onClick={() => toggleItemStock(item._id, item.outOfStock)}
                  >
                    {item.outOfStock ? "Out of Stock" : "In Stock"}
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
          </>
        )}

        {activeTab === "orders" && (
          <>
          <div style={{ marginBottom: "20px" }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-filter-input"
            />
          </div>
            <h3>📦 Current Orders</h3>
            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              Object.entries(
                orders
                  .filter(order => {
                    const date = new Date(order.createdAt || order.date || order._id.substring(0, 8));
                    const localDateString = date.toLocaleDateString('en-CA');
                    return !selectedDate || localDateString === selectedDate;
                  })
                  .reduce((grouped, order) => {
                    const date = new Date(order.createdAt || order.date || order._id.substring(0, 8));
                    const localDateString = date.toLocaleDateString('en-CA');
                    if (!grouped[localDateString]) grouped[localDateString] = [];
                    grouped[localDateString].push(order);
                    return grouped;
                  }, {})
              )
              .map(([date, ordersOnDate]) => (
                <div key={date}>
                  <h4 style={{ marginTop: "24px", marginBottom: "10px", color: "#444" }}>
                    {new Date(date).toDateString()}
                  </h4>
                  {ordersOnDate.map((order, index) => (
                    <div key={order._id} className="order-card">
                      <p><strong>Order {index + 1}</strong> — #{order._id}</p>
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
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboard;
