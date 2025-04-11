import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentHome from "./pages/StudentHome";
import RestaurantDashboard from "./pages/RestaurantDashboard"; // create later
import PrivateRoute from "./components/PrivateRoute"; // we'll make this too

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

  useEffect(() => {
    axios
      .get("http://localhost:4003/vendor/67e5e60abf07321dec19fff6")
      .then((res) => setVendors([res.data]))
      .catch((err) => console.error("Error fetching vendor:", err));
  }, []);

  const addItem = (item) => {
    const exists = selectedItems.find((i) => i.name === item.name);
    if (exists) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (item) => {
    const exists = selectedItems.find((i) => i.name === item.name);
    if (exists.quantity === 1) {
      setSelectedItems(selectedItems.filter((i) => i.name !== item.name));
    } else {
      setSelectedItems(
        selectedItems.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }
  };

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
        console.log("✔️ Full res.data structure 👀:", res.data);
        const orderData = res?.data;
        const orderId = res.data.order._id;

      
        if (!orderId) {
          console.error("❌ Order ID not found. Full response:", res);
          throw new Error("Order ID not found in response");
        }
      

        const paymentPayload = {
          user_id: "mdasari1",
          order_id: orderId,
          amount: totalAmount,
          method: paymentMethod.toLowerCase().replace(" ", "_"),
          status: "paid",
        };

        console.log("💳 Sending payment payload:", paymentPayload);

        axios.post("http://localhost:4005/payments", paymentPayload)
          .then((paymentRes) => {
            setSelectedItems([]);
            setShowPaymentModal(false);
            setLastPayment(paymentRes.data.payment);
            setShowReceipt(true);
            setTimeout(() => {
              setShowReceipt(false);
              setView("orders");
              fetchOrders();
            }, 3000); // 3 seconds
          })
          .catch((err) => {
            console.error("💥 Payment failed:", err.response?.data || err.message);
            alert("Payment failed: " + (err.response?.data?.message || err.message));
          });
      })
      .catch((err) => {
        console.error("❌ Order placement failed:", err.response?.data || err.message);
        alert("Failed to place order");
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
        <Modal.Title>✅ Payment Successful</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Order ID:</strong> {lastPayment?.order_id}</p>
        <p><strong>Amount:</strong> ${lastPayment?.amount}</p>
        <p><strong>Method:</strong> {lastPayment?.method}</p>
        <p><strong>Status:</strong> {lastPayment?.status}</p>
      </Modal.Body>
    </Modal>
  );

  const renderCartButton = () => {
    if (selectedItems.length === 0 || view === "cart") return null;
    const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    return (
      <div style={{ position: "fixed", bottom: 80, left: "30%", right: "30%", zIndex: 1000 }}>
        <button className="btn btn-dark w-100" onClick={() => setView("cart")}>
          View Cart • {totalItems}
        </button>
      </div>
    );
  };

  const renderHeader = () => (
    <div className="d-flex justify-content-between align-items-center border-bottom p-3">
      <h4 className="mb-0">Campus Food</h4>
      <div>
        <button className="btn btn-link" onClick={() => setView("restaurants")}>Restaurants</button>
        <button className="btn btn-link" onClick={() => { setView("orders"); fetchOrders(); }}>Orders</button>
        <button className="btn btn-link" onClick={() => setView("cart")}>Cart</button>
      </div>
    </div>
  );

  const renderVendors = () => (
    <div className="p-3">
      {vendors.map((vendor) => (
        <div key={vendor._id} className="card p-3 mb-4">
          <h5>{vendor.name}</h5>
          <small>{vendor.address}</small>
          <hr />
          {vendor.menu.map((item) => {
            const existing = selectedItems.find((i) => i.name === item.name);
            return (
              <div key={item.name} className="d-flex justify-content-between align-items-center my-2">
                <div>
                  <strong>{item.name}</strong> - ${item.price}
                </div>
                {existing ? (
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => removeItem(item)}>-</button>
                    <span>{existing.quantity}</span>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => addItem(item)}>+</button>
                  </div>
                ) : (
                  <button className="btn btn-outline-primary btn-sm" onClick={() => addItem(item)}>+</button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderCart = () => {
    const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (selectedItems.length === 0) {
      return (
        <div className="text-center mt-5">
          <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" width="100" alt="Cart" />
          <h5 className="mt-3">Add items to start a cart</h5>
          <p>Once you add items from a restaurant or store, your cart will appear here.</p>
          <button className="btn btn-dark mt-2" onClick={() => setView("restaurants")}>
            Start Shopping
          </button>
        </div>
      );
    }

    return (
      <div className="container mt-4">
        <div className="card p-3">
          <h5>🛒 Your Cart</h5>
          <div className="mb-2 text-muted">{vendors[0]?.name}</div>
          {selectedItems.map((item, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center mb-2">
              <div>{item.name} - ${item.price}</div>
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => removeItem(item)}>-</button>
                <span>{item.quantity}</span>
                <button className="btn btn-outline-primary btn-sm" onClick={() => addItem(item)}>+</button>
              </div>
            </div>
          ))}
          <button className="btn btn-outline-secondary btn-sm my-2" onClick={() => setView("restaurants")}>
            + Add more items
          </button>
          <hr />
          <div><strong>Total: </strong>${total.toFixed(2)}</div>
        </div>
        <div className="fixed-bottom p-3 bg-white border-top">
          <button className="btn btn-primary w-100" onClick={() => setShowPaymentModal(true)}>
            Go to Checkout • ${total.toFixed(2)}
          </button>
        </div>
      </div>
    );
  };

  const renderOrders = () => (
    <div className="p-3">
      <h5>📜 Order History</h5>
      {orders.length === 0 ? (
        <p>No previous orders.</p>
      ) : (
        <ul className="list-group">
          {orders.map((order, index) => (
            <li key={index} className="list-group-item">
              <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}<br />
              <strong>Total:</strong> ${order.totalAmount}<br />
              <strong>Items:</strong>
              <ul>
                {order.items.map((item, idx) => (
                  <li key={idx}>{item.name} × {item.quantity}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Only for Students */}
        <Route
          path="/campus-food-app"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentHome />
            </PrivateRoute>
          }
        />

        {/* Only for Restaurant Owners */}
        <Route
          path="/restaurant-dashboard"
          element={
            <PrivateRoute allowedRoles={["restaurant"]}>
              <RestaurantDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;