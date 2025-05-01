import React, { useState } from "react";
import "./Settings.css";

const EditPasswordView = ({ onBack, onChangePassword }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("❌ New passwords do not match.");
      return;
    }

    await onChangePassword(currentPassword, newPassword, confirmPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onBack();
  };

  return (
    <div className="settings-edit-container">
      <button className="back-button" onClick={onBack}>← Back</button>
      <h2 className="settings-title">Change Password</h2>
      <p className="settings-subtext">Use a strong password you haven’t used before.</p>

      <input
        className="settings-input"
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <input
        className="settings-input"
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        className="settings-input"
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button className="update-button" onClick={handleUpdate}>Update</button>
    </div>
  );
};

export default EditPasswordView;
