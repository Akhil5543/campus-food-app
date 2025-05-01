import React from "react";
import axios from "axios";

const DeleteAccount = ({ token }) => {
  const handleDelete = async () => {
    if (!window.confirm("⚠️ Are you sure you want to delete your account? This cannot be undone.")) return;

    try {
      await axios.delete("https://auth-service-fgt8.onrender.com/delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      alert("❌ " + (err.response?.data?.message || "Delete failed"));
    }
  };

  return (
    <div className="settings-container">
      <h2>🗑️ Delete My Account</h2>
      <p>This action is permanent and cannot be undone.</p>
      <button onClick={handleDelete} style={{ backgroundColor: "#ff4d4f", color: "#fff", marginTop: "1rem" }}>
        Delete Account Permanently
      </button>
      <button onClick={() => window.history.back()} style={{ marginTop: "1rem" }}>← Cancel</button>
    </div>
  );
};

export default DeleteAccount;
