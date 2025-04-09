import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const StudentHome = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("restaurants");
  const [paymentMethod, setPaymentMethod] = useState("Campus Card");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);

  const token = localStorage.getItem("token") || "";

  // Decode name from token
  let studentName = "Student";
  if (token) {
    try {
      const decoded = jwtDecode(token);
      studentName = decoded.name || "Student";
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

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
        const orderId = res.data.order._id;

        const paymentPayload = {
          user_id: "mdasari1",
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
            console.error("Payment failed:", err);
            alert("Payment failed");
          });
      })
      .catch((err) => {
        console.error("Order placement failed:", err);
        alert("Failed to place order");
      });
  };

  const fetchOrders = () => {
    axios
      .get("http://localhost:4001/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Error fetching orders:", err));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center border-bottom p-3">
        <h4 className="mb-0">Campus Food – Welcome, {studentName} 👋</h4>
        <div>
          <button className="btn btn-link" onClick={() => setView("restaurants")}>Restaurants</button>
          <button className="btn btn-link" onClick={() => { setView("orders"); fetchOrders(); }}>Orders</button>
          <button className="btn btn-link" onClick={() => setView("cart")}>Cart</button>
          <button className="btn btn-danger ms-3" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {view === "restaurants" && (
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
      )}

      {view === "cart" && (
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
            <div><strong>Total: </strong>${selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</div>
          </div>
          <div className="fixed-bottom p-3 bg-white border-top">
            <button className="btn btn-primary w-100" onClick={() => setShowPaymentModal(true)}>
              Go to Checkout • ${selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {view === "orders" && (
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
      )}

      {selectedItems.length > 0 && view !== "cart" && (
        <div style={{ position: "fixed", bottom: 80, left: "30%", right: "30%", zIndex: 1000 }}>
          <button className="btn btn-dark w-100" onClick={() => setView("cart")}>
            View Cart • {selectedItems.reduce((sum, i) => sum + i.quantity, 0)}
          </button>
        </div>
      )}

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Payment Method</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option>Campus Card</option>
            <option>Credit Card</option>
            <option>Cash</option>
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={placeOrder}>Confirm & Pay</Button>
        </Modal.Footer>
      </Modal>

      {/* Receipt Modal */}
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
    </div>
  );
};

export default StudentHome;
