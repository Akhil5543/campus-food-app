import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./StudentHome.css";

const StudentHome = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
  const [view, setView] = useState("restaurants");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Campus Card");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);

  const token = localStorage.getItem("token") || "";
  let studentName = "Student";
  if (token) {
    try {
      const decoded = jwtDecode(token);
      studentName = decoded.name || "Student";
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  useEffect(() => {
    axios
      .get("http://localhost:4003/vendor/67e5e60abf07321dec19fff6")
      .then((res) => setVendors([res.data]))
      .catch((err) => console.error("Error fetching vendor:", err));
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setExpandedRestaurantId(prev => (prev === id ? null : id));
  };

  const addItem = (e, item) => {
    e.stopPropagation();
    const exists = selectedItems.find(i => i.name === item.name);
    if (exists) {
      setSelectedItems(
        selectedItems.map(i =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (e, item) => {
    e.stopPropagation();
    const exists = selectedItems.find(i => i.name === item.name);
    if (exists.quantity === 1) {
      setSelectedItems(selectedItems.filter(i => i.name !== item.name));
    } else {
      setSelectedItems(
        selectedItems.map(i =>
          i.name === item.name ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = () => {
    const totalAmount = subtotal;
    const restaurantId = "65f122b4c2d12a0012f986bd";

    axios
      .post("http://localhost:4001/orders", {
        restaurantId,
        items: selectedItems,
        totalAmount,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const orderId = res.data.order._id;

        const paymentPayload = {
          user_id: "mdasari1",
          order_id: orderId,
          amount: totalAmount,
          method: paymentMethod.toLowerCase().replace(" ", "_"),
          status: "paid",
        };

        return axios.post("http://localhost:4005/payments", paymentPayload);
      })
      .then((paymentRes) => {
        setSelectedItems([]);
        setShowPaymentModal(false);
        setLastPayment(paymentRes.data.payment);
        setShowReceiptModal(true);
        setView("restaurants");
      })
      .catch((err) => {
        console.error("Order or payment failed:", err);
        alert("Something went wrong during checkout.");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          Campus Food – Welcome, {studentName} 👋
        </div>
        <div className="header-buttons">
          <button onClick={() => setView("restaurants")}>Restaurants</button>
          <button onClick={() => setView("cart")}>Cart</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {view === "restaurants" && (
        <>
          <div className="search-bar">
            <input type="text" placeholder="Search restaurants..." />
          </div>

          <h5 className="section-title">Popular Restaurants</h5>

          <div className="popular-restaurants">
            {vendors.map((vendor) => (
              <div
                key={vendor._id}
                className="restaurant-card"
                onClick={(e) => toggleMenu(e, vendor._id)}
              >
                <div className="restaurant-header">
                  <h5 className="restaurant-name">
                    {vendor.name}
                    <span className="rating-badge">4.7</span>
                  </h5>
                  <div className="text-muted">{vendor.address} • 15-25 min</div>
                </div>

                {expandedRestaurantId === vendor._id && (
                  <div className="menu-items mt-3">
                    {vendor.menu.map((item) => {
                      const existing = selectedItems.find((i) => i.name === item.name);
                      return (
                        <div key={item.name} className="menu-item">
                          <div className="item-info">
                            <div className="item-name">{item.name}</div>
                            <div className="item-price">${item.price}</div>
                          </div>
                          {existing ? (
                            <div className="cart-controls">
                              <button onClick={(e) => removeItem(e, item)}>-</button>
                              <span>{existing.quantity}</span>
                              <button onClick={(e) => addItem(e, item)}>+</button>
                            </div>
                          ) : (
                            <button onClick={(e) => addItem(e, item)}>+</button>
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

      {view === "cart" && (
        <div className="cart-view">
          <h3>Your Cart</h3>
          {selectedItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            selectedItems.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <div className="cart-controls">
                  <button onClick={(e) => removeItem(e, item)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={(e) => addItem(e, item)}>+</button>
                </div>
              </div>
            ))
          )}

          {selectedItems.length > 0 && (
            <>
              <div className="cart-total">
                Subtotal: <strong>${subtotal.toFixed(2)}</strong>
              </div>
              <button className="checkout-btn" onClick={() => setShowPaymentModal(true)}>
                Go to Checkout
              </button>
            </>
          )}
        </div>
      )}

      {selectedItems.length > 0 && view !== "cart" && (
        <div className="view-cart-footer">
          <button onClick={() => setView("cart")}>
            View Cart • {selectedItems.reduce((sum, i) => sum + i.quantity, 0)}
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
            <p><strong>Amount:</strong> ${lastPayment?.amount}</p>
            <p><strong>Status:</strong> {lastPayment?.status}</p>
            <button onClick={() => setShowReceiptModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
