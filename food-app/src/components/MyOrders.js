import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./MyOrders.css";
import FeedbackModal from "./FeedbackModal";

const getVendorLogo = (name) => {
  if (!name) return "/images/default-logo.png";
  const formatted = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `/images/${formatted}.png`;
};

const MyOrders = ({ orders, setCartVisible, updateSelectedItems }) => {
  const [savedOrders, setSavedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrderToRate, setSelectedOrderToRate] = useState(null);
  const [vendorRatings, setVendorRatings] = useState({});

  // ✅ Fetch average rating per vendor
  useEffect(() => {
    const fetchVendorRatings = async () => {
      const vendorIds = [...new Set(orders.map(order => order.restaurantId))];

      const ratingPromises = vendorIds.map(async (vendorId) => {
        try {
          const res = await axios.get(
            `https://order-service-vgej.onrender.com/vendor/${vendorId}/average-rating`
          );
          return { vendorId, rating: res.data?.averageRating?.toFixed(1) || "0.0" };
        } catch {
          return { vendorId, rating: "0.0" };
        }
      });

      const results = await Promise.all(ratingPromises);
      const ratingsMap = {};
      results.forEach(({ vendorId, rating }) => {
        ratingsMap[vendorId] = rating;
      });
      setVendorRatings(ratingsMap);
    };

    if (orders.length > 0) {
      fetchVendorRatings();
    }
  }, [orders]);

  // Decode token to get studentId
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

  // Save order as favorite
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

  // Handle reorder
  const reorderItems = (order) => {
    if (!order) return;

    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];

    const updatedCart = [
      ...existingCart,
      ...order.items.map(item => ({
        ...item,
        quantity: item.quantity,
        vendorName: order.restaurantName,
        vendorId: order.restaurantId,
      })),
    ];

    localStorage.setItem("cartItems", JSON.stringify(updatedCart));
    alert("✅ Items added to your cart!");

    if (typeof setCartVisible === "function") setCartVisible(true);
    if (typeof updateSelectedItems === "function") updateSelectedItems(updatedCart);

    setSelectedOrder(null);
  };

  const calculateSubtotal = (items) => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="orders-view">
      <h2>Past Orders</h2>
      {orders.length === 0 ? (
        <p>No past orders found.</p>
      ) : (
        orders.map((order, index) => (
          <div
            key={index}
            className="order-card"
            onClick={() => openOrderDetails(order)}
          >
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
                  {order.items.length} item{order.items.length > 1 ? "s" : ""} • $
                  {order.totalAmount.toFixed(2)} •{" "}
                  {new Date(order.createdAt).toLocaleString()}
                  <br />
                  ⭐ Avg Rating: {vendorRatings[order.restaurantId] || "0.0"}
                </div>
              </div>
            </div>

            <button
              className="favorite-btn"
              onClick={(e) => {
                e.stopPropagation();
                saveOrderAsFavorite(order);
              }}
              disabled={savedOrders.includes(order._id)}
            >
              {savedOrders.includes(order._id) ? "✅ Saved" : "❤️ Save to Favorites"}
            </button>
          </div>
        ))
      )}

      {selectedOrder && (
        <div className="order-modal">
          <div className="order-modal-content">
            <button className="close-btn" onClick={closeOrderDetails}>✖️ Close</button>
            <h2>{selectedOrder.restaurantName}</h2>
            <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>

            <div className="modal-items">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="modal-item">
                  {item.name} × {item.quantity} — ${item.price.toFixed(2)}
                </div>
              ))}
            </div>

            <div className="modal-summary">
              <p>Subtotal: ${calculateSubtotal(selectedOrder.items).toFixed(2)}</p>
              <p>Tax: ${(calculateSubtotal(selectedOrder.items) * 0.08).toFixed(2)}</p>
              <p><strong>Total: ${(calculateSubtotal(selectedOrder.items) * 1.08).toFixed(2)}</strong></p>
            </div>

            {selectedOrder.status === "Delivered" && (
              <button
                className="rate-btn"
                onClick={() => {
                  setSelectedOrderToRate(selectedOrder);
                  setShowFeedbackModal(true);
                }}
              >
                ⭐ Rate Order
              </button>
            )}

            <button
              className="reorder-btn"
              onClick={() => reorderItems(selectedOrder)}
            >
              🔁 Reorder
            </button>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedOrderToRate && (
        <FeedbackModal
          order={selectedOrderToRate}
          onClose={() => setShowFeedbackModal(false)}
          onSubmitSuccess={() => {
            setShowFeedbackModal(false);
            setSelectedOrderToRate(null);
            alert("✅ Thanks for your feedback!");
          }}
        />
      )}
    </div>
  );
};

export default MyOrders;
