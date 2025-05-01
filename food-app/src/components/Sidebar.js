import React from "react";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose, setView, handleLogout }) => {
  console.log("setView received in Sidebar:", typeof setView);

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <button className="menu-item" onClick={() => { setView("restaurants"); onClose(); }}>
          📋 <span>Restaurants</span>
        </button>

        <button className="menu-item" onClick={() => { console.log("Sidebar clicked: My Orders"); setView("orders"); onClose(); }}>
          📦 <span>My Orders</span>
        </button>

        <button className="menu-item" onClick={() => { setView("favoriteOrders"); onClose(); }}>
          ❤️ <span>Favorite Orders</span>
        </button>

        <button className="menu-item" onClick={() => { setView("notifications"); onClose(); }}>
          🔔 <span>Notifications</span>
        </button>

        <button className="menu-item" onClick={() => { handleLogout(); onClose(); }}>
          🔓 <span>Logout</span>
        </button>
      </div>

      {isOpen && <div className="overlay" onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;
