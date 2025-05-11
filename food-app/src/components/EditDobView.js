import React, { useState, useEffect } from "react";
import "./Settings.css";

const EditDobView = ({ onBack, currentDob, onUpdateDob }) => {
  const [newDob, setNewDob] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentDob) {
      // Convert to YYYY-MM-DD for input[type="date"]
      const formatted = new Date(currentDob).toISOString().split("T")[0];
      setNewDob(formatted);
    }
  }, [currentDob]);

  const handleSubmit = () => {
    if (!newDob) {
      setError("Please select a valid date of birth.");
      return;
    }

    if (newDob === currentDob) {
      setError("No changes detected.");
      return;
    }

    const selected = new Date(newDob);
    const today = new Date();

    if (selected >= today) {
      setError("Date of birth cannot be today or in the future.");
      return;
    }

    onUpdateDob(newDob);
    onBack();
  };

  return (
    <div className="settings-edit-container">
      <button className="back-button" onClick={onBack}>← Back</button>
      <h2 className="settings-title">Update Date of Birth</h2>
      <p className="settings-subtext">Please choose a valid past date.</p>

      <input
        className="settings-input"
        type="date"
        value={newDob}
        onChange={(e) => {
          setNewDob(e.target.value);
          setError("");
        }}
        max={new Date().toISOString().split("T")[0]} // today's date
      />

      {error && <p className="error-message">{error}</p>}

      <button className="update-button" onClick={handleSubmit}>Update</button>
    </div>
  );
};

export default EditDobView;
