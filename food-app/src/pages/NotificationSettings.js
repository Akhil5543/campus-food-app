import React from "react";

const NotificationSettings = ({ notificationPrefs, setNotificationPrefs, setView }) => {
  return (
    <div className="settings-container">
      <h2>🔔 Notification Settings</h2>
      <label style={{ fontSize: "16px", display: "flex", alignItems: "center", gap: "1rem" }}>
        <input
          type="checkbox"
          checked={notificationPrefs}
          onChange={() => setNotificationPrefs(!notificationPrefs)}
        />
        Enable Order Updates
      </label>
      <button onClick={() => setView("settings")} style={{ marginTop: "2rem" }}>
        ← Back
      </button>
    </div>
  );
};

export default NotificationSettings;
