import React, { useState } from "react";
import axios from "axios";

const UpdateProfile = ({ name, email, token, setView, setName, setEmail }) => {
  const [newName, setNewNameInput] = useState("");
  const [newEmail, setNewEmailInput] = useState("");

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.patch(
        "https://auth-service-fgt8.onrender.com/update-profile",
        { newName, newEmail },
        authHeaders
      );
      alert("✅ " + res.data.message);
      if (newName) setName(newName);
      if (newEmail) setEmail(newEmail);
      setView("settings");
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Update failed"));
    }
  };

  return (
    <div className="settings-container">
      <h2>👤 Update Profile</h2>
      <p><strong>Current Name:</strong> {name}</p>
      <p><strong>Current Email:</strong> {email}</p>
      <input
        type="text"
        placeholder="New Name"
        value={newName}
        onChange={(e) => setNewNameInput(e.target.value)}
      />
      <input
        type="email"
        placeholder="New Email"
        value={newEmail}
        onChange={(e) => setNewEmailInput(e.target.value)}
      />
      <button onClick={handleUpdate}>Save Changes</button>
      <button onClick={() => setView("settings")} style={{ marginTop: "1rem" }}>← Back</button>
    </div>
  );
};

export default UpdateProfile;
