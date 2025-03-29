import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:4003/vendor/67e5e60abf07321dec19fff6")
      .then(res => setVendors([res.data]))
      .catch(err => console.error("Error fetching vendor:", err));
  }, []);

  const addItem = (item) => {
    const existing = selectedItems.find(i => i.name === item.name);
    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (item) => {
    const existing = selectedItems.find(i => i.name === item.name);
    if (existing.quantity === 1) {
      setSelectedItems(selectedItems.filter(i => i.name !== item.name));
    } else {
      setSelectedItems(selectedItems.map(i =>
        i.name === item.name ? { ...i, quantity: i.quantity - 1 } : i
      ));
    }
  };

  const placeOrder = () => {
    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    axios.post("http://localhost:4001/orders", {
      restaurantId: "65f122b4c2d12a0012f986bd",
      items: selectedItems,
      totalAmount,
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setOrderSuccess(true);
        setSelectedItems([]);
        setTimeout(() => setOrderSuccess(false), 4000);
      })
      .catch(err => alert("Failed to place order"));
  };

  const fetchOrders = () => {
    axios.get("http://localhost:4001/orders")
      .then(res => setOrders(res.data))
      .catch(err => console.error("Error fetching orders:", err));
  };

  const toggleHistory = () => {
    const willShow = !showHistory;
    setShowHistory(willShow);
    if (willShow) fetchOrders();
  };

  return (
    <div className="container mt-4">
      <h2>Campus Food Ordering App</h2>

      <button className="btn btn-secondary mb-3" onClick={toggleHistory}>
        {showHistory ? "Hide Order History" : "Show Order History"}
      </button>

      {showHistory && (
        <div className="card p-3 mb-4">
          <h4>📜 Order History</h4>
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

      {vendors.map((vendor) => (
        <div key={vendor._id} className="card p-3 my-3">
          <h4>{vendor.name}</h4>
          <small>{vendor.address}</small>

          {vendor.menu.map((item) => (
            <div key={item.name} className="d-flex justify-content-between align-items-center my-2">
              <span>{item.name} - ${item.price}</span>
              <button className="btn btn-sm btn-outline-primary" onClick={() => addItem(item)}>Add</button>
            </div>
          ))}
        </div>
      ))}

      <h5 className="mt-4">Cart:</h5>
      <ul className="list-group mb-3">
        {selectedItems.map((item, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{item.name} × {item.quantity}</span>
            <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(item)}>Remove</button>
          </li>
        ))}
      </ul>

      {selectedItems.length > 0 && (
        <button className="btn btn-success" onClick={placeOrder}>Place Order</button>
      )}

      {orderSuccess && (
        <div className="alert alert-success mt-4">
          🎉 Your order has been placed successfully!
        </div>
      )}
    </div>
  );
}

export default App;
