import React from "react";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose, setView, handleLogout }) => {
  const handleViewChange = (viewName) => {
    setView(viewName);
    onClose();
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
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
          onClick={() => handleViewChange("settings")}
        >
          ⚙️ <span>Settings</span>
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
