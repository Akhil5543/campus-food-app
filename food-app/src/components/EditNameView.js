import React, { useState } from "react";
import "./Settings.css";

const EditNameView = ({ onBack, currentName, onUpdateName }) => {
  const nameParts = currentName.trim().split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");

  const handleUpdate = async () => {
    if (!firstName.trim()) {
      alert("First name cannot be empty.");
      return;
    }
    const fullName = `${firstName} ${lastName}`.trim();
    await onUpdateName(fullName);
    onBack();
  };

  return (
    <div className="settings-edit-container">
      <button className="back-button" onClick={onBack}>← Back</button>
      <h2 className="settings-title">Update Name</h2>
      <p className="settings-subtext">This is the name you would like other people to use when referring to you.</p>

      <input
        className="settings-input"
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
      />
      <input
        className="settings-input"
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
      />

      <button className="update-button" onClick={handleUpdate}>Update</button>
    </div>
  );
};

export default EditNameView;
