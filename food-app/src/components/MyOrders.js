import React from "react";
import "./MyOrders.css";

const getVendorLogo = (name) => {
  if (!name) return "/images/default-logo.png";
  const formatted = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `/images/${formatted}.png`;
};

const MyOrders = ({ orders }) => {
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
          </div>
        ))
      )}
    </div>
  );
};


export default MyOrders;

