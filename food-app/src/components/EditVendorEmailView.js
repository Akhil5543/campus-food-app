import React, { useState } from "react";
import axios from "axios";
import "./VendorSettings.css";


const EditVendorEmailView = ({ vendor, token, setSettingsView }) => {
  const [email, setEmail] = useState(vendor?.email || "");

  const handleUpdate = async () => {
    try {
      await axios.put("https://auth-service-fgt8.onrender.com/vendor/update-email", {
        value: email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Email updated successfully");
      setSettingsView("main");
    } catch (err) {
      console.error(err);
      alert("Failed to update email");
    }
  };

  return (
    <div className="settings-container">
      <p className="back-btn" onClick={() => setSettingsView("main")}>← Back</p>
      <h2>Update Email</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="New email" />
      <button className="btn black" onClick={handleUpdate}>Update</button>
    </div>
  );
};

export default EditVendorEmailView;
