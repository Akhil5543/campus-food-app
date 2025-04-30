import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./UserSettings.css";

const UserSettings = () => {
  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : {};
  const [name, setName] = useState(decoded.name || "");
  const [email, setEmail] = useState(decoded.email || "");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [message, setMessage] = useState("");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("❌ New passwords do not match.");
      return;
    }

    try {
      const res = await axios.patch(
        "http://localhost:4006/update-password",
        { currentPassword, newPassword },
        authHeaders
      );
      setMessage("✅ " + res.data.message);
    } catch (err) {
      setMessage("❌ " + err.response?.data?.message || "Failed to update password.");
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const res = await axios.patch(
        "http://localhost:4006/update-profile",
        { newName, newEmail },
        authHeaders
      );
      setMessage("✅ " + res.data.message);
      if (newName) setName(newName);
      if (newEmail) setEmail(newEmail);
      setNewName("");
      setNewEmail("");
    } catch (err) {
      setMessage("❌ " + err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account?")) return;

    try {
      await axios.delete("http://localhost:4006/delete-account", authHeaders);
      localStorage.removeItem("token");
      window.location.href = "/login"; // redirect to login
    } catch (err) {
      setMessage("❌ " + err.response?.data?.message || "Failed to delete account.");
    }
  };

  return (
    <div className="settings-container">
      <h2>⚙️ Account Settings</h2>

      <div className="settings-section">
        <h3>👤 Profile</h3>
        <p><strong>Current Name:</strong> {name}</p>
        <p><strong>Current Email:</strong> {email}</p>
        <input
          type="text"
          placeholder="New Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          type="email"
          placeholder="New Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button onClick={handleProfileUpdate}>Update Profile</button>
      </div>

      <div className="settings-section">
        <h3>🔒 Change Password</h3>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handlePasswordChange}>Update Password</button>
      </div>

      <div className="settings-section">
        <h3>🔔 Notifications</h3>
        <label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
          />
          Enable Order Updates
        </label>
      </div>

      <div className="settings-section danger-zone">
        <h3>🗑️ Danger Zone</h3>
        <button onClick={handleDeleteAccount}>Delete Account</button>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default UserSettings;
