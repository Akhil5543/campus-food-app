import React, { useState, useEffect } from "react";
import "./Settings.css";

const EditPhoneView = ({ onBack, currentPhone, onUpdatePhone }) => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentPhone) setPhone(currentPhone);
  }, [currentPhone]);

  const validatePhone = (num) => /^[0-9]{10}$/.test(num); // basic 10-digit check

  const handleSubmit = () => {
    if (!phone) {
      setError("Phone number cannot be empty.");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Please enter a valid 10-digit number.");
      return;
    }

    if (phone === currentPhone) {
      setError("No changes made.");
      return;
    }

    onUpdatePhone(phone);
    onBack();
  };

  return (
    <div className="settings-edit-container">
      <button className="back-button" onClick={onBack}>← Back</button>
      <h2 className="settings-title">Update Phone Number</h2>
      <p className="settings-subtext">Enter a valid 10-digit number.</p>

      <input
        className="settings-input"
        type="tel"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          setError("");
        }}
        maxLength={10}
        placeholder="9876543210"
      />

      {error && <p className="error-message">{error}</p>}

      <button className="update-button" onClick={handleSubmit}>Update</button>
    </div>
  );
};

export default EditPhoneView;
