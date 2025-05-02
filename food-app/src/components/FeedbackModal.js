import React, { useState } from "react";
import axios from "axios";
import "./FeedbackModal.css";

const FeedbackModal = ({ order, userId, onClose, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a rating!");

    try {
      setSubmitting(true);
      await axios.post("https://order-service-vgej.onrender.com/feedback", {
        orderId: order._id,
        vendorId: order.restaurantId,
        userId,
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
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={(hover || rating) >= star ? "selected" : ""}
            >
              ⭐
            </span>
          ))}
        </div>

        {rating > 0 && (
          <p style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
            You selected {rating} star{rating > 1 ? "s" : ""}
          </p>
        )}

        <textarea
          placeholder="Optional feedback..."
          rows="4"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        />

        <div style={{ marginTop: "10px" }}>
          <button
            className="submit-rating-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
          <button className="cancel-rating-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
