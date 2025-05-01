import React, { useState } from "react";

const EditDobView = ({ onBack, currentDob, onUpdateDob }) => {
  const [newDob, setNewDob] = useState(currentDob || "");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!newDob) {
      setError("Please enter a valid date of birth.");
      return;
    }

    if (newDob === currentDob) {
      setError("Date of birth is unchanged.");
      return;
    }

    const selectedDate = new Date(newDob);
    const today = new Date();

    if (selectedDate >= today) {
      setError("Date of birth cannot be today or in the future.");
      return;
    }

    onUpdateDob(newDob);
    onBack();
  };

  return (
    <div className="edit-view">
      <h3>Edit Date of Birth</h3>
      <input
        type="date"
        value={newDob}
        onChange={(e) => {
          setNewDob(e.target.value);
          setError("");
        }}
        max={new Date().toISOString().split("T")[0]}
      />
      {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}
      <button onClick={handleSubmit}>Update DOB</button>
      <button onClick={onBack}>Cancel</button>
    </div>
  );
};

export default EditDobView;
