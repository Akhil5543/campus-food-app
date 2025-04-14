import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentHome from "./pages/StudentHome";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import PrivateRoute from "./components/PrivateRoute";


function App() {
  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("restaurants");
  const [paymentMethod, setPaymentMethod] = useState("Campus Card");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);

  const token = localStorage.getItem("token") || "";
  const decodedToken = token ? jwtDecode(token) : null;

  useEffect(() => {
    axios
      .get("http://localhost:4003/vendor/67e5e60abf07321dec19fff6")
      .then((res) => setVendors([res.data]))
      .catch((err) => console.error("Error fetching vendor:", err));
  }, []);

  const placeOrder = () => {
    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    axios
      .post(
        "http://localhost:4001/orders",
        {
          restaurantId: "65f122b4c2d12a0012f986bd",
          items: selectedItems,
          totalAmount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        const orderId = res.data.order?._id;
        if (!orderId) throw new Error("Order ID not found");

        const paymentPayload = {
          user_id: decodedToken?.id || "unknown_user",
          order_id: orderId,
          amount: totalAmount,
          method: paymentMethod.toLowerCase().replace(" ", "_"),
          status: "paid",
        };

        axios
          .post("http://localhost:4005/payments", paymentPayload)
          .then((paymentRes) => {
            setSelectedItems([]);
            setShowPaymentModal(false);
            setLastPayment(paymentRes.data.payment);
            setShowReceipt(true);
            setTimeout(() => {
              setShowReceipt(false);
              setView("orders");
              fetchOrders();
            }, 3000);
          })
          .catch((err) => {
            alert("Payment failed: " + (err.response?.data?.message || err.message));
          });
      })
      .catch((err) => {
        alert("Failed to place order: " + (err.response?.data?.message || err.message));
      });
  };

  const fetchOrders = () => {
    axios
      .get("http://localhost:4001/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Error fetching orders:", err));
  };

  const renderReceiptModal = () => (
    <Modal show={showReceipt} onHide={() => setShowReceipt(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <span role="img" aria-label="checkmark">✅</span> Payment Successful
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Order ID:</strong> {lastPayment?.order_id}</p>
        <p><strong>Amount:</strong> ${lastPayment?.amount}</p>
        <p><strong>Method:</strong> {lastPayment?.method}</p>
        <p><strong>Status:</strong> {lastPayment?.status}</p>
      </Modal.Body>
    </Modal>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student Dashboard */}
        <Route
          path="/campus-food-app"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentHome
                vendors={vendors}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                placeOrder={placeOrder}
                view={view}
                setView={setView}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                showPaymentModal={showPaymentModal}
                setShowPaymentModal={setShowPaymentModal}
                fetchOrders={fetchOrders}
                orders={orders}
              />
            </PrivateRoute>
          }
        />

        {/* Restaurant Dashboard */}
        <Route
          path="/restaurant-dashboard"
          element={
            <PrivateRoute allowedRoles={["restaurant"]}>
              <RestaurantDashboard />
            </PrivateRoute>
          }
        />
      </Routes>

      {/* Global Receipt Modal */}
      {renderReceiptModal()}
    </Router>
  );
}

export default App;
