import React from "react";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose, setView, handleLogout }) => {
  const handleViewChange = (viewName) => {
    console.log(`✅ Sidebar clicked: ${viewName}`);
    setView(viewName);
    onClose();
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      <div className="sidebar-menu">
        <button
          type="button"
          className="menu-item"
          onClick={() => handleViewChange("restaurants")}
        >
          🍽️ <span>Restaurants</span>
        </button>

        <button
          type="button"
          className="menu-item"
          onClick={() => handleViewChange("orders")}
        >
          📦 <span>My Orders</span>
        </button>

        <button
          type="button"
          className="menu-item"
          onClick={() => handleViewChange("favoriteOrders")}
        >
          ❤️ <span>Favorite Orders</span>
        </button>

        <button
          type="button"
          className="menu-item"
          onClick={() => handleViewChange("notifications")}
        >
          🔔 <span>Notifications</span>
        </button>

        <button
          type="button"
          className="menu-item"
          onClick={handleLogout}
        >
          🔒 <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
