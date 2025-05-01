// EditEmailView.js
import React, { useState } from "react";
import "./Settings.css";

const EditEmailView = ({ onBack, currentEmail, onUpdateEmail }) => {
  const [newEmail, setNewEmail] = useState(currentEmail);

  const handleUpdate = async () => {
    await onUpdateEmail(newEmail);
    onBack();
  };

  return (
    <div className="settings-edit-container">
      <button className="back-button" onClick={onBack}>← Back</button>
      <h2 className="settings-title">Update Email</h2>
      <p className="settings-subtext">Use a valid email where we can send order updates and receipts.</p>

      <input
        className="settings-input"
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        placeholder="Enter new email"
      />

      <button className="update-button" onClick={handleUpdate}>Update</button>
    </div>
  );
};

export default EditEmailView;
