import React, { useState } from "react";
import axios from "axios";
import "./VendorSettings.css";


const EditVendorNameView = ({ vendor, token, setSettingsView, setVendor }) => {
  const [name, setName] = useState(vendor?.name || "");

  const handleUpdate = async () => {
    try {
      await axios.put("https://auth-service-fgt8.onrender.com/vendor/update-name", {
        value: name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setVendor((prev) => ({ ...prev, name }));
      alert("Name updated successfully");
      setSettingsView("main");
    } catch (err) {
      console.error(err);
      alert("Failed to update name");
    }
  };

  return (
    <div className="settings-container">
      <p className="back-btn" onClick={() => setSettingsView("main")}>← Back</p>
      <h2>Update Name</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New name" />
      <button className="btn black" onClick={handleUpdate}>Update</button>
    </div>
  );
};

export default EditVendorNameView;
