import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

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
      .then(res => alert("Order placed!"))
      .catch(err => alert("Failed to place order"));
  };

  return (
    <div className="container mt-4">
      <h2>Campus Food Ordering App</h2>
  
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
      <ul>
        {selectedItems.map((item, index) => (
          <li key={index}>{item.name} × {item.quantity}</li>
        ))}
      </ul>
  
      {selectedItems.length > 0 && (
        <button className="btn btn-success" onClick={placeOrder}>Place Order</button>
      )}
    </div>
  );
  
  
}

export default App;

