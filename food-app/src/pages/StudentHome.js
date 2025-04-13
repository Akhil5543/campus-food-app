import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import MyOrders from "../components/MyOrders";
import "./StudentHome.css";

const StudentHome = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
  const [view, setView] = useState("restaurants");
  const [orderHistory, setOrderHistory] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Campus Card");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const socket = io("https://order-service-k4v1.onrender.com");
  const [searchTerm, setSearchTerm] = useState("");


  const token = localStorage.getItem("token") || "";
  let studentName = "Student";
  let studentId = "";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      studentName = decoded.name || "Student";
      studentId = decoded.userId || decoded.id || decoded.sub || "";
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  const getVendorLogo = (name) => {
    const formatted = name.toLowerCase().replace(/\s+/g, "-");
    return `${process.env.PUBLIC_URL}/images/${formatted}.png`;
  };

  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) setSelectedItems(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(selectedItems));
  }, [selectedItems]);

  useEffect(() => {
    axios
      .get("https://vendor-service-wnkw.onrender.com/vendors")
      .then((res) => setVendors(res.data))
      .catch((err) => console.error("Error fetching vendors:", err));

    if (studentId) {
      axios
        .get(`https://order-service-k4v1.onrender.com/orders/user/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setOrderHistory(res.data.orders))
        .catch((err) => console.error("Error fetching order history:", err));
    }
  }, [studentId, token]);
  useEffect(() => {
    socket.on("orderStatusUpdated", (data) => {
      setNotifications((prev) => [
        ...prev,
        `Order #${data.orderId} status changed to ${data.status}`,
      ]);
    });

    return () => {
      socket.off("orderStatusUpdated");
    };
  }, []);



  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setExpandedRestaurantId((prev) => (prev === id ? null : id));
  };

  const addItem = (e, item, vendorName) => {
    e.stopPropagation();
    const exists = selectedItems.find(
      (i) => i.name === item.name && i.vendorName === vendorName
    );
    const vendorId = expandedRestaurantId;

    if (exists) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.name === item.name && i.vendorName === vendorName
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        { ...item, quantity: 1, vendorName, vendorId },
      ]);
    }
  };

  const removeItem = (e, item) => {
    e.stopPropagation();
    const exists = selectedItems.find(
      (i) => i.name === item.name && i.vendorName === item.vendorName
    );
    if (exists.quantity === 1) {
      setSelectedItems(
        selectedItems.filter(
          (i) => !(i.name === item.name && i.vendorName === item.vendorName)
        )
      );
    } else {
      setSelectedItems(
        selectedItems.map((i) =>
          i.name === item.name && i.vendorName === item.vendorName
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      );
    }
  };

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = () => {
    const grouped = selectedItems.reduce((acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          restaurantId: item.vendorId,
          items: [],
          totalAmount: 0,
        };
      }
      acc[item.vendorId].items.push(item);
      acc[item.vendorId].totalAmount += item.price * item.quantity;
      return acc;
    }, {});


    const orderPromises = Object.values(grouped).map((orderData) =>
      axios
        .post("https://order-service-k4v1.onrender.com/orders", orderData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const orderId = res.data.order._id;
          const paymentPayload = {
            user_id: studentId,
            order_id: orderId,
            amount: orderData.totalAmount,
            method: paymentMethod.toLowerCase().replace(" ", "_"),
            status: "paid",
          };
          return axios.post("https://payment-service-fgt8.onrender.com/payments", paymentPayload);
        })
    );

    Promise.all(orderPromises)
      .then((results) => {
        const totalPaid = results.reduce((sum, res) => {
          const amt = parseFloat(res?.data?.payment?.amount);
          return !isNaN(amt) ? sum + amt : sum;
        }, 0);

        const allOrderIds = results
          .map((res) => res?.data?.payment?.order_id)
          .filter(Boolean)
          .join(", ");

        setSelectedItems([]);
        localStorage.removeItem("cartItems");
        setCartVisible(false); // ✅ Auto-close cart after payment
        setShowPaymentModal(false);
        setLastPayment({
          order_id: allOrderIds,
          amount: totalPaid,
          status: "paid",
        });
        setShowReceiptModal(true);
        setView("restaurants");

        axios
          .get(`https://order-service-k4v1.onrender.com/orders/user/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => setOrderHistory(res.data.orders))
          .catch((err) =>
            console.error("Error refreshing order history:", err)
          );
      })
      .catch((err) => {
        console.error("Multi-vendor checkout failed:", err);
        alert("Something went wrong during checkout.");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cartItems");
    navigate("/login");
  };

  const toggleCart = () => {
    setCartVisible(!cartVisible);
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          Campus Food – Welcome, {studentName} 👋
        </div>
        <div className="header-buttons">
          <button onClick={() => setView("restaurants")}>Restaurants</button>
          <button onClick={() => setView("orders")}>My Orders</button>
          <button onClick={() => setView("notifications")}>🔔 Notifications {notifications.length > 0 && `(${notifications.length})`}</button>
          <button onClick={toggleCart}>
            Cart 🛒 {selectedItems.reduce((sum, i) => sum + i.quantity, 0)}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {view === "restaurants" && (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="popular-restaurants">
            {vendors
              .filter((vendor) =>
                vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((vendor) => (
                <div
                  key={vendor._id}
                  className="restaurant-card"
                  onClick={(e) => toggleMenu(e, vendor._id)}
                >
                  <div className="restaurant-content">
                    <img
                      className="restaurant-image"
                      src={getVendorLogo(vendor.name)}
                      alt={vendor.name}
                    />
                    <div>
                      <h5 className="restaurant-name">
                        {vendor.name}
                        <span className="rating-badge">4.7</span>
                      </h5>
                      <div className="text-muted">{vendor.address}</div>
                    </div>
                  </div>
                  {expandedRestaurantId === vendor._id && (
                    <div className="menu-items mt-3">
                      {vendor.menu.map((item) => {
                        const existing = selectedItems.find(
                          (i) =>
                            i.name === item.name &&
                            i.vendorName === vendor.name
                        );
                        return (
                          <div key={item.name} className="menu-item">
                            <div className="item-info">
                              <div className="item-name">{item.name}</div>
                              <div className="item-price">${item.price}</div>
                            </div>
                            {existing ? (
                              <div className="cart-controls">
                                <button onClick={(e) => removeItem(e, item)}>
                                  -
                                </button>
                                <span>{existing.quantity}</span>
                                <button
                                  onClick={(e) =>
                                    addItem(e, item, vendor.name)
                                  }
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) =>
                                  addItem(e, item, vendor.name)
                                }
                              >
                                +
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}

      {view === "orders" && <MyOrders orders={orderHistory} />}
      {view === "notifications" && (
        <div className="notifications-view">
          <h3>🔔 Notifications</h3>
          {notifications.length === 0 ? (
           <p>No new notifications.<p>
          ) : (
            <ul>
              {notifications.map((note, index) => (
                <li key={index} className="notification-item">{note}<li>
              ))}
            <ul>
          )}
        <div>
      )}



      <div className={`cart-view ${cartVisible ? "show" : ""}`}>
        <div className="cart-header">
          <button className="close-button" onClick={() => setCartVisible(false)}>
            ✕
          </button>
          <div className="cart-title">Your Cart</div>
        </div>

        <div className="cart-items">
          {selectedItems.length === 0 ? (
            <p className="empty-cart-message">Your cart is currently empty.</p>
          ) : (
            Object.entries(
              selectedItems.reduce((grouped, item) => {
                if (!grouped[item.vendorName]) {
                  grouped[item.vendorName] = {
                    vendorId: item.vendorId,
                    items: [],
                  };
                }
                grouped[item.vendorName].items.push(item);
                return grouped;
              }, {})
            ).map(([vendorName, { vendorId, items }]) => (
              <div key={vendorName} className="vendor-cart-group">
                <div className="cart-restaurant-info">
                  <img
                    src={getVendorLogo(vendorName)}
                    alt={vendorName}
                    className="cart-restaurant-logo"
                  />
                  <span className="cart-restaurant-name">{vendorName}</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="cart-item">
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="quantity-control">
                      <button className="quantity-btn" onClick={(e) => removeItem(e, item)}>
                        −
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button className="quantity-btn" onClick={(e) => addItem(e, item, vendorName)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <hr />
              </div>
            ))
          )}
        </div>

        {selectedItems.length > 0 && (
          <>
            <div className="cart-actions">
              <button
                className="action-btn secondary"
                onClick={() => {
                  setView("restaurants");
                  setCartVisible(false);
                }}
              >
                + Add More Items
              </button>
              <button className="action-btn primary" onClick={() => setShowPaymentModal(true)}>
                Go to Checkout
              </button>
            </div>
            <div className="cart-total">
              Subtotal: <strong>${subtotal.toFixed(2)}</strong>
            </div>
          </>
        )}
      </div>

      {selectedItems.length > 0 && !cartVisible && (
        <div className="view-cart-footer">
          <button onClick={toggleCart}>
            View Cart • {selectedItems.reduce((sum, i) => sum + i.quantity, 0)} • ${subtotal.toFixed(2)}
          </button>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4>Select Payment Method</h4>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option>Campus Card</option>
              <option>Credit Card</option>
              <option>Cash</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button onClick={placeOrder}>Confirm & Pay</button>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4>✅ Payment Successful</h4>
            <p><strong>Order ID:</strong> {lastPayment?.order_id}</p>
            <p>
              <strong>Amount:</strong> $
              {!isNaN(lastPayment?.amount)
                ? Number(lastPayment.amount).toFixed(2)
                : "0.00"}
            </p>
            <p><strong>Status:</strong> {lastPayment?.status}</p>
            <button onClick={() => setShowReceiptModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
