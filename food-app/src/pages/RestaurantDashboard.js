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
  const [showPopup, setShowPopup] = useState(false);
  const [newOrderInfo, setNewOrderInfo] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [expandedOrders, setExpandedOrders] = useState([]);
  const sidebarRef = useRef();

  const token = localStorage.getItem("token");
  let ownerId = null;

  try {
    const decoded = jwtDecode(token);
    console.log("Decoded token:", decoded);
    ownerId = decoded.ownerId || decoded.id || decoded.sub;
    console.log("Resolved ownerId:", ownerId);
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
    const endpoint = currentStatus
      ? `https://vendor-service-wnkw.onrender.com/vendor/${vendor._id}/menu/${itemId}/in-stock`
      : `https://vendor-service-wnkw.onrender.com/vendor/${vendor._id}/menu/${itemId}/out-of-stock`;

    await axios.put(endpoint);
    fetchVendor();
  } catch (err) {
    console.error("Error updating item stock status:", err);
  }
};


  const toggleTodaysSpecial = async (itemId, currentSpecialStatus) => {
  try {
    await axios.put(`https://vendor-service-wnkw.onrender.com/vendor/${vendor._id}/menu/${itemId}/todays-special`, {
      todaysSpecial: !currentSpecialStatus,
    });
    fetchVendor(); // Refresh menu after toggling
  } catch (err) {
    console.error("Error toggling Today's Special status:", err);
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
  
const calculateEarnings = () => {
  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];

  let todaySales = 0;
  let weekSales = 0;
  let monthSales = 0;

  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const localOrderDate = new Date(orderDate.getTime() - orderDate.getTimezoneOffset() * 60000);
    const orderDateString = localOrderDate.toISOString().split('T')[0];

    const daysDifference = (today - localOrderDate) / (1000 * 60 * 60 * 24);

    if (orderDateString === todayDate) {
      todaySales += order.totalAmount;
    }
    if (daysDifference <= 7) {
      weekSales += order.totalAmount;
    }
    if (daysDifference <= 30) {
      monthSales += order.totalAmount;
    }
  });

  return { todaySales, weekSales, monthSales };
};
const handleSelectAll = () => {
  if (selectedOrders.length === orders.length) {
    setSelectedOrders([]); // Deselect all
  } else {
    setSelectedOrders(orders.map((order) => order._id)); // Select all
  }
};

const handleSelectOrder = (orderId) => {
  setSelectedOrders((prev) =>
    prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
  );
};

const handleBulkUpdate = async (newStatus) => {
  try {
    await Promise.all(
      selectedOrders.map((orderId) =>
        axios.patch(`https://order-service-vgej.onrender.com/orders/${orderId}/status`, { status: newStatus })
      )
    );
    setSelectedOrders([]);
    fetchOrders();
  } catch (err) {
    console.error("Error bulk updating orders:", err);
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
    socket.on("newOrderReceived", (order) => {
    setNewOrderInfo(order);
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
      setNewOrderInfo(null);
    }, 5000);
  });
    return () => {
      socket.off("refreshVendorOrders", fetchOrders);
      socket.off("newOrderReceived");
    };

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
const toggleExpandOrder = (orderId) => {
  setExpandedOrders(prev =>
    prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
  );
};


  return (
    <>
    <div className="dashboard-background"></div>
    <div className="background-overlay"></div>
    <div className="app-overlay">
    <div className="dashboard-container">
    
    {showPopup && newOrderInfo && (
      <div className="popup-notification">
        🔔 New Order Received: {newOrderInfo.items.map(item => item.name).join(", ")} (${newOrderInfo.totalAmount})
      </div>
    )}
    {!sidebarOpen && (
  <div className="hamburger-icon" onClick={() => setSidebarOpen(true)}>☰</div>
)}

    <div className={`sidebar ${sidebarOpen ? "open" : ""}`} ref={sidebarRef}>
  <div className="sidebar-links">
    <button
      className={activeTab === "menu" ? "active" : ""}
      onClick={() => {
        setActiveTab("menu");
        setSidebarOpen(false);
      }}
    >
      🍔 Menu
    </button>
    <button
      className={activeTab === "orders" ? "active" : ""}
      onClick={() => {
        setActiveTab("orders");
        setSidebarOpen(false);
      }}
    >
      📦 Orders
    </button>
    <button
      className={activeTab === "sales" ? "active" : ""}
      onClick={() => {
        setActiveTab("sales");
        setSidebarOpen(false);
      }}
    >
      📈 Sales
    </button>
    <button
      onClick={() => {
        setSidebarOpen(false);
        handleLogout();
      }}
    >
      🔓 Logout
    </button>
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
                  <strong>
                {capitalizeWords(item.name)}
                {item.todaysSpecial && <span className="special-badge">⭐</span>}
                </strong>: ${item.price} – {item.description}
                  <button
                    className={`mark-out-of-stock-btn ${item.outOfStock ? "disabled" : ""}`}
                    onClick={() => toggleItemStock(item._id, item.outOfStock)}
                  >
                    {item.outOfStock ? "Out of Stock" : "In Stock"}
                  </button>
                  <button
                    className="special-btn"
                    onClick={() => toggleTodaysSpecial(item._id, item.todaysSpecial)}
                  >
                    {item.todaysSpecial ? "Unmark Special" : "Mark Special"}
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
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search by Order ID or Customer Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-filter-input"
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="status-filter-input"
            >
              <option value="All">All Orders</option>
              <option value="Received">Received</option>
              <option value="Preparing">Preparing</option>
              <option value="Delivered">Delivered</option>
           </select>
          </div>



          {selectedOrders.length > 0 && (
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px",alignItems: "center" }}>
              <button onClick={handleSelectAll} className="btn">
                {selectedOrders.length === orders.length ? "Deselect All" : "Select All"}
              </button>
              <button onClick={() => handleBulkUpdate("Preparing")} className="btn yellow">
                Mark Selected as Preparing
              </button>
              <button onClick={() => handleBulkUpdate("Delivered")} className="btn black">
                Mark Selected as Delivered
              </button>
           </div>
          )}


            <h3>📦 Current Orders</h3>
            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              Object.entries(
                orders
                  .filter(order => {
                        const date = new Date(order.createdAt);
                        const localDateString = date.toISOString().split('T')[0];
                        const matchesDate = !selectedDate || localDateString === selectedDate;
                        const matchesSearch =
                          order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
                        const matchesStatus =
                          selectedStatus === "All" || order.status?.toLowerCase() === selectedStatus.toLowerCase();

                        return matchesDate && matchesSearch && matchesStatus;
                  })
                  .reduce((grouped, order) => {
                    const date = new Date(order.createdAt);
                    const localDateString = date.toISOString().split('T')[0];
                    
                    if (!grouped[localDateString]) grouped[localDateString] = [];
                    grouped[localDateString].push(order);
                    
                    return grouped;
                  }, {})
              )
              .map(([date, ordersOnDate]) => (
                <div key={date}>
                  <h4 style={{ marginTop: "24px", marginBottom: "10px", color: "#444" }}>
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </h4>
                  {ordersOnDate.map((order, index) => (
                    <div key={order._id} className="order-card">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        style={{ marginBottom: "10px" }}
                      />
                      <p
                        onClick={() => toggleExpandOrder(order._id)} 
                        style={{ fontWeight: "bold", cursor: "pointer" }}
                      >
                        Order {index + 1} — #{order._id}
                      </p>
                      <p><strong>Customer:</strong> {order.customerName || "N/A"}</p>
                      <p>Status: <span className="status">{order.status}</span></p>
                      <p>Total: ${order.totalAmount}</p>
                      {expandedOrders.includes(order._id) && (
                        <ul>
                        {order.items.map((item, idx) => (
                          <li key={idx}>{item.name} × {item.quantity}</li>
                        ))}
                      </ul>
                      )}

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
       {activeTab === "sales" && (
       <>
    <h3>📈 Sales Dashboard</h3>
    <div className="sales-dashboard">
      {(() => {
        const { todaySales, weekSales, monthSales } = calculateEarnings();
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="sales-card">
              <h4>Today's Earnings</h4>
              <p>${todaySales.toFixed(2)}</p>
            </div>
            <div className="sales-card">
              <h4>This Week's Earnings</h4>
              <p>${weekSales.toFixed(2)}</p>
            </div>
            <div className="sales-card">
              <h4>This Month's Earnings</h4>
              <p>${monthSales.toFixed(2)}</p>
            </div>
          </div>
          );
          })()}
          </div>
          </>
        )}

      </div>
    </div>
   </div> {/* Close app-overlay */}
   </>
  );
};

export default RestaurantDashboard;
