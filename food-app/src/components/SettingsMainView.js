// SettingsMainView.js
import React from "react";
import "./Settings.css";

const SettingsMainView = ({ onNavigate }) => {
  return (
    <div className="settings-container">
      <h2 className="settings-title">Account Settings</h2>

      <div className="settings-row" onClick={() => onNavigate("edit-name")}> 
        <div className="settings-label">Name</div>
        <div className="settings-value">Mounika Dasari</div>
        <div className="settings-arrow">➔</div>
      </div>

      <div className="settings-row" onClick={() => onNavigate("edit-email")}> 
        <div className="settings-label">Email</div>
        <div className="settings-value">mounikayadav2526@gmail.com</div>
        <div className="settings-arrow">➔</div>
      </div>

      <div className="settings-row" onClick={() => onNavigate("edit-password")}> 
        <div className="settings-label">Password</div>
        <div className="settings-value">********</div>
        <div className="settings-arrow">➔</div>
      </div>

      <div className="settings-row danger" onClick={() => onNavigate("delete-account")}> 
        <div className="settings-label">Danger Zone</div>
        <div className="settings-value">Delete Account</div>
        <div className="settings-arrow">➔</div>
      </div>
    </div>
  );
};

export default SettingsMainView;
