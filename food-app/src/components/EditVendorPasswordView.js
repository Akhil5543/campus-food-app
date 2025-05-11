import React, { useState } from "react";
import axios from "axios";
import "./VendorSettings.css";

const EditVendorPasswordView = ({ token, setSettingsView }) => {
  const [password, setPassword] = useState("");

  const handleUpdate = async () => {
    try {
      await axios.put("https://auth-service-fgt8.onrender.com/vendor/update-password", {
        value: password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Password updated successfully");
      setSettingsView("main");
    } catch (err) {
      console.error(err);
      alert("Failed to update password");
    }
  };

  return (
    <div className="settings-container">
      <p className="back-btn" onClick={() => setSettingsView("main")}>← Back</p>
      <h2>Change Password</h2>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
      <button className="btn black" onClick={handleUpdate}>Change</button>
    </div>
  );
};

export default EditVendorPasswordView;
