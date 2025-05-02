import React, { useState } from "react";
import axios from "axios";
import "./FeedbackModal.css";

const FeedbackModal = ({ order, onClose, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a rating!");

    try {
      setSubmitting(true);
       await axios.post("https://order-service-vgej.onrender.com/feedback", {
        orderId: order._id,
        vendorId: order.restaurantId,
        rating,
        feedback,
      });

      onSubmitSuccess(); // closes modal and triggers success alert
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("❌ Failed to submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <h3>Rate your order from {order.restaurantName}</h3>
        
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              style={{
                fontSize: "30px",
                cursor: "pointer",
                color: star <= rating ? "gold" : "gray",
              }}
            >
              ⭐
            </span>
          ))}
        </div>

        <textarea
          placeholder="Optional feedback..."
          rows="4"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <div style={{ marginTop: "10px" }}>
          <button onClick={handleSubmit} disabled={submitting} style={{ marginRight: "8px" }}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
