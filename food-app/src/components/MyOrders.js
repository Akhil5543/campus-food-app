import React from "react";
import "./MyOrders.css";


const MyOrders = ({ orders }) => {
  return (
    <div className="myorders-container">
      <h3 className="myorders-title">Past Orders</h3>
      {orders.map((order) => {
        const restaurantName = order.restaurantName || "Unknown Restaurant";
        const restaurantImageUrl =
          order.restaurantImage || "/images/restaurant-placeholder.jpg";

        return (
          <div className="order-card" key={order._id}>
            <div className="order-header">
              <img
                src={restaurantImageUrl}
                alt={restaurantName}
                className="order-restaurant-image"
              />
              <div className="order-header-details">
                <h4 className="restaurant-name">{restaurantName}</h4>
                <div className="order-meta">
                  <span>
                    {order.items.length} item
                    {order.items.length > 1 ? "s" : ""} for $
                    {order.totalAmount?.toFixed(2)} •{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="order-actions">
                <button className="order-action-btn">View receipt</button>
                <button className="order-action-btn">Request invoice</button>
              </div>
            </div>
            <div className="order-items">
              {order.items.map((item, index) => (
                <div className="order-item" key={index}>
                  <div className="item-name">{item.name}</div>
                  {/* Add extra details if you want, e.g., sauce, toppings, etc. */}
                </div>
              ))}
            </div>
            <div className="order-rate">
              <button className="rate-order-btn">Rate your order</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyOrders;
