import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import "./Checkout.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const SuccessModal = ({ onClose }) => (
  <div className="success-modal">
    <div className="success-modal-content">
      <h2>✅ Payment Successful!</h2>
      <p>Thank you! Your order has been placed.</p>
      <button onClick={onClose}>Close</button>
    </div>
  </div>
);

const CheckoutForm = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create Stripe Payment Intent
      const { data } = await axios.post(
        "https://campus-food-app.onrender.com/create-payment-intent",
        { amount },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Step 2: Confirm card payment
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        setShowSuccess(true);
        // 👉 Pass result to parent (StudentHome.js)
        onSuccess(result.paymentIntent);
      } else {
        alert("❌ Payment failed");
      }
    } catch (error) {
      console.error("❌ Payment error:", error);
      alert("Payment processing error");
    }

    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
        </div>
        <button type="submit" disabled={!stripe || loading}>
          {loading ? "Processing..." : "Pay"}
        </button>
      </form>
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </>
  );
};

const Checkout = ({ amount, onSuccess }) => (
  <Elements stripe={stripePromise}>
    <CheckoutForm amount={amount} onSuccess={onSuccess} />
  </Elements>
);

export default Checkout;
