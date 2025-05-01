import React from "react";
import { FaLock, FaEnvelope, FaBell, FaExclamationTriangle } from "react-icons/fa";
import "./SettingsView.css";

const SettingsView = ({ setView }) => {
  return (
    <div className="settings-container">
      <h2 className="settings-title">Account settings</h2>

      <div className="settings-option" onClick={() => setView("change-password")}>
        <FaLock className="icon" />
        <span>Change password</span>
        <span className="arrow">›</span>
      </div>

      <div className="settings-option" onClick={() => setView("update-profile")}>
        <FaEnvelope className="icon" />
        <span>Update email</span>
        <span className="arrow">›</span>
      </div>

      <div className="settings-option" onClick={() => setView("notification-settings")}>
        <FaBell className="icon" />
        <span>Notification settings</span>
        <span className="arrow">›</span>
      </div>

      <div className="settings-option danger" onClick={() => setView("delete-account")}>
        <FaExclamationTriangle className="icon" />
        <span>Delete my account</span>
      </div>
    </div>
  );
};

export default SettingsView;
