import React, { useState } from "react";

const EditPhoneView = ({ onBack, currentPhone, onUpdatePhone }) => {
  const [newPhone, setNewPhone] = useState(currentPhone || "");
  const [error, setError] = useState("");

  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  const handleSubmit = () => {
    if (!validatePhone(newPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (newPhone === currentPhone) {
      setError("Phone number is unchanged.");
      return;
    }
    onUpdatePhone(newPhone);
    onBack();
  };

  return (
    <div className="edit-view">
      <h3>Edit Phone Number</h3>
      <input
        type="tel"
        pattern="[0-9]{10}"
        value={newPhone}
        onChange={(e) => {
          setNewPhone(e.target.value);
          setError("");
        }}
        placeholder="Enter new phone number"
      />
      {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
      <div className="edit-actions">
        <button onClick={handleSubmit}>Update Phone</button>
        <button onClick={onBack}>Cancel</button>
      </div>
    </div>
  );
};

export default EditPhoneView;
