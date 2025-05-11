import React from "react";
import axios from "axios";
import "./VendorSettings.css";

const DeleteVendorAccountView = ({ token, navigate }) => {
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;

    try {
      await axios.delete("https://auth-service-fgt8.onrender.com/vendor/delete-account", {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Account deleted");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Failed to delete account");
    }
  };

  return (
    <div className="settings-container">
      <p className="back-btn" onClick={() => navigate("/restaurant-dashboard")}>← Back</p>
      <h2>Delete Account</h2>
      <p>This action is irreversible. All your data will be permanently removed.</p>
      <button className="btn danger" onClick={handleDelete}>Delete My Account</button>
    </div>
  );
};

export default DeleteVendorAccountView;
