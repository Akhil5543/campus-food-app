import React from "react";
import "./DeleteAccountView.css";

const DeleteAccountView = ({ onBack, onDelete }) => {
  return (
    <div className="delete-account-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2 className="delete-title">Delete Your Account</h2>
      <p className="delete-warning">
        This action cannot be undone. Your account and all order data will be permanently removed from the system.
      </p>
      <button className="delete-btn" onClick={onDelete}>
        Permanently Delete My Account
      </button>
    </div>
  );
};

export default DeleteAccountView;
