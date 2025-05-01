import React from "react";
import "./FeedbackModal.css"; // optional for styling

const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <h4>We value your feedback!</h4>
        <textarea placeholder="Write your feedback here..." rows="4" style={{ width: "100%" }} />
        <div style={{ marginTop: "10px" }}>
          <button onClick={onSubmit} style={{ marginRight: "8px" }}>Submit</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
