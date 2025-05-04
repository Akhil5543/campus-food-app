import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import MyOrders from "../components/MyOrders";
import "./StudentHome.css";
import Checkout from "./Checkout";
import SettingsMainView from "../components/SettingsMainView";
import EditNameView from "../components/EditNameView";
import EditEmailView from "../components/EditEmailView";
import EditPasswordView from "../components/EditPasswordView";
import EditDobView from "../components/EditDobView";
import EditPhoneView from "../components/EditPhoneView";
import Sidebar from "../components/Sidebar"; 

const token = localStorage.getItem("token") || "";
  let studentName = "Student";
  let studentId = "";
  let decoded = null;

  if (token) {
    try {
      decoded = jwtDecode(token);
      studentName = decoded.name || "Student";
      studentId = decoded.userId || decoded.id || decoded.sub || "";
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }
  
const StudentHome = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
  const [view, setView] = useState("restaurants");
  const [settingsView, setSettingsView] = useState("main");
  const [orderHistory, setOrderHistory] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Campus Card");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteOrders, setFavoriteOrders] = useState([]);
  const [name, setName] = useState(studentName);
  const [email, setEmail] = useState(decoded?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [repeatableVendors, setRepeatableVendors] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [suggestedVendor, setSuggestedVendor] = useState(null);
  
  const authHeaders = {
   headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    if (token) {
      axios
        .get("https://auth-service-fgt8.onrender.com/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const user = res.data.user;
          if (user.dob) setDob(user.dob);
          if (user.phone_number) setPhoneNumber(user.phone_number);
        })
        .catch((err) => {
          console.error("Failed to fetch user profile:", err);
        });
    }
  }, []);
 
const handleUpdateName = async (fullName) => {
  try {
    const res = await axios.patch(
      "https://auth-service-fgt8.onrender.com/update-profile",
      { newName: fullName },
      authHeaders
    );
    alert("✅ " + res.data.message);
    setName(fullName);
  } catch (err) {
    alert("❌ " + (err.response?.data?.message || "Failed to update name."));
  }
};

const handleUpdateDob = async (updatedDob) => {
  try {
    const res = await axios.patch(
      "https://auth-service-fgt8.onrender.com/update-profile",
      { dob: updatedDob },
      authHeaders
    );
    alert("✅ " + res.data.message);
    setDob(updatedDob);
  } catch (err) {
    alert("❌ " + (err.response?.data?.message || "Failed to update DOB."));
  }
};

const handleUpdatePhone = async (updatedPhone) => {
  try {
    const res = await axios.patch(
      "https://auth-service-fgt8.onrender.com/update-profile",
      { phone_number: updatedPhone },
      authHeaders
    );
    alert("✅ " + res.data.message);
    setPhoneNumber(updatedPhone);
  } catch (err) {
    alert("❌ " + (err.response?.data?.message || "Failed to update phone number."));
  }
};

const handleUpdateEmail = async (updatedEmail) => {
  try {
    const res = await axios.patch(
      "https://auth-service-fgt8.onrender.com/update-profile",
      { newEmail: updatedEmail },
      authHeaders
    );
    alert("✅ " + res.data.message);
    setEmail(updatedEmail);
  } catch (err) {
    alert("❌ " + (err.response?.data?.message || "Failed to update email."));
  }
};


  const handlePasswordChange = async () => {
  if (newPassword !== confirmPassword) {
    alert("❌ New passwords do not match.");
    return;
  }

  try {
    const res = await axios.patch(
      "https://auth-service-fgt8.onrender.com/update-password",
      { currentPassword, newPassword },
      authHeaders
    );
    alert("✅ " + res.data.message);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (err) {
    alert("❌ " + (err.response?.data?.message || "Failed to update password."));
  }
};


const handleDeleteAccount = async () => {
  if (!window.confirm("Are you sure you want to permanently delete your account?")) return;

  try {
    await axios.delete("https://auth-service-fgt8.onrender.com/delete-account", authHeaders);
    localStorage.removeItem("token");
    window.location.href = "/login";
  } catch (err) {
    alert("❌ " + (err.response?.data?.message || "Failed to delete account."));
  }
};

  
  const getVendorLogo = (name) => {
    const formatted = name.toLowerCase().replace(/\s+/g, "-");
    return `${process.env.PUBLIC_URL}/images/${formatted}.png`;
  };

  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) setSelectedItems(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(selectedItems));
  }, [selectedItems]);
  useEffect(() => {
  if (view === "favoriteOrders" && studentId) {
    axios
      .get(`https://order-service-vgej.onrender.com/favorite-order/user/${studentId}`)
      .then((res) => {
        setFavoriteOrders(res.data.favorites || []);
      })
      .catch((err) => console.error("Error fetching favorite orders:", err));
  }
}, [view, studentId]);

  useEffect(() => {
    const fetchVendorsWithRatings = async () => {
      try {
        const vendorRes = await axios.get("https://vendor-service-wnkw.onrender.com/vendors");
        const vendorsData = vendorRes.data;
  
        const updated = await Promise.all(
          vendorsData.map(async (vendor) => {
            try {
              const res = await axios.get(
                `https://order-service-vgej.onrender.com/vendor/${vendor._id}/average-rating`
              );
              return {
                ...vendor,
                averageRating: res.data?.averageRating?.toFixed(1) || "0.0",
              };
            } catch (err) {
              return { ...vendor, averageRating: "0.0" };
            }
          })
        );
  
        setVendors(updated);
      } catch (err) {
        console.error("Failed to fetch vendors with ratings", err);
      }
    };
  
    fetchVendorsWithRatings();
  }, []);
  
  // 🔁 Fetch past orders when studentId is ready
  useEffect(() => {
    if (studentId) {
      axios
        .get(`https://order-service-vgej.onrender.com/orders/user/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setOrderHistory(res.data.orders); // ✅ now inside
          const now = new Date();
          const recentVendors = {};
  
          res.data.orders.forEach((order) => {
            const daysAgo = (now - new Date(order.createdAt)) / (1000 * 60 * 60 * 24);
            if (daysAgo >= 5) {
              if (
                !recentVendors[order.restaurantId] ||
                new Date(order.createdAt) > new Date(recentVendors[order.restaurantId].createdAt)
              ) {
                recentVendors[order.restaurantId] = {
                  vendorId: order.restaurantId,
                  vendorName: order.restaurantName,
                  items: order.items,
                  createdAt: order.createdAt,
                };
              }
            }
          });
  
          setRepeatableVendors(Object.values(recentVendors));
          const repeatable = Object.values(recentVendors);
          setRepeatableVendors(repeatable);
          
          if (repeatable.length > 0 && !sessionStorage.getItem("toastShown")) {
            setSuggestedVendor(repeatable[0]); 
            setShowToast(true);

            sessionStorage.setItem("toastShown", "true");
          }
        })
        .catch((err) => {
          console.error("❌ Failed to fetch past orders:", err);
        });
    }
  }, [studentId]);
  

  useEffect(() => {
  const socket = io("https://order-service-vgej.onrender.com");

  socket.on("orderStatusUpdated", (data) => {
  const { orderId, status, vendorName, createdAt } = data;
  const dateKey = new Date(createdAt).toISOString().split("T")[0];

  const sameDayOrders = orderHistory.filter(
    (o) =>
      new Date(o.createdAt).toISOString().split("T")[0] === dateKey &&
      o.restaurantName === vendorName
  );

  const index = sameDayOrders.findIndex((o) => o._id === orderId);
  const orderLabel = index !== -1 ? `Order ${index + 1}` : "Order";

  setNotifications((prev) => [
    ...prev,
    `${orderLabel} from ${vendorName} is now ${status}`,
  ]);
});


  return () => {
    socket.disconnect();
  };
}, [orderHistory]);
  useEffect(() => {
  if (showToast) {
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 7000); // Auto-close after 7 seconds

    return () => clearTimeout(timer); 
  }
}, [showToast]);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setExpandedRestaurantId((prev) => (prev === id ? null : id));
  };

  const addItem = (e, item, vendorName) => {
    e.stopPropagation();
    const exists = selectedItems.find(
      (i) => i.name === item.name && i.vendorName === vendorName
    );
    const vendorId = expandedRestaurantId;

    if (exists) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.name === item.name && i.vendorName === vendorName
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        { ...item, quantity: 1, vendorName, vendorId },
      ]);
    }
  };

  const removeItem = (e, item) => {
    e.stopPropagation();
    const exists = selectedItems.find(
      (i) => i.name === item.name && i.vendorName === item.vendorName
    );
    if (exists.quantity === 1) {
      setSelectedItems(
        selectedItems.filter(
          (i) => !(i.name === item.name && i.vendorName === item.vendorName)
        )
      );
    } else {
      setSelectedItems(
        selectedItems.map((i) =>
          i.name === item.name && i.vendorName === item.vendorName
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      );
    }
  };
const saveFavoriteOrder = async () => {
  if (!studentId || selectedItems.length === 0) {
    alert("No recent order to save!");
    return;
  }

  try {
    const grouped = selectedItems.reduce((acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          items: [],
        };
      }
      acc[item.vendorId].items.push({
        itemId: item._id || item.itemId || "",
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      });
      return acc;
    }, {});

    // Save each restaurant's order separately
    const savePromises = Object.values(grouped).map(order =>
      axios.post("https://order-service-vgej.onrender.com/favorite-order", {
        userId: studentId,
        vendorId: order.vendorId,
        vendorName: order.vendorName,
        items: order.items,
      })
    );

    await Promise.all(savePromises);
    alert("✅ Order saved to Favorites!");
    setShowReceiptModal(false); // Close receipt after saving
  } catch (err) {
    console.error("Error saving favorite order:", err);
    alert("Something went wrong while saving favorite order.");
  }
};

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const placeOrder = () => {
    const grouped = selectedItems.reduce((acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          restaurantId: item.vendorId,
          restaurantName: item.vendorName,
          items: [],
          totalAmount: 0,
        };
      }
      acc[item.vendorId].items.push(item);
      acc[item.vendorId].totalAmount += item.price * item.quantity;
      return acc;
    }, {});

    const orderPromises = Object.values(grouped).map((orderData) =>
      axios
        .post("https://order-service-vgej.onrender.com/orders",
              {
                ...orderData, 
              customerName: studentName,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const orderId = res.data.order._id;
          const paymentPayload = {
            user_id: studentId,
            order_id: orderId,
            amount: orderData.totalAmount,
            method: paymentMethod.toLowerCase().replace(" ", "_"),
            status: "paid",
          };
          return axios.post("https://campus-food-app.onrender.com/payments", paymentPayload);
        })
    );

    Promise.all(orderPromises)
      .then((results) => {
        const totalPaid = results.reduce((sum, res) => {
          const amt = parseFloat(res?.data?.payment?.amount);
          return !isNaN(amt) ? sum + amt : sum;
        }, 0);

        const allOrderIds = results
          .map((res) => res?.data?.payment?.order_id)
          .filter(Boolean)
          .join(", ");

        setSelectedItems([]);
        localStorage.removeItem("cartItems");
        setCartVisible(false); // ✅ Auto-close cart after payment
        setShowPaymentModal(false);
        setLastPayment({
          order_id: allOrderIds,
          amount: totalPaid,
          status: "paid",
        });
        setShowReceiptModal(true);
        setView("restaurants");

        axios
          .get(`https://order-service-vgej.onrender.com/orders/user/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => setOrderHistory(res.data.orders))
          .catch((err) =>
            console.error("Error refreshing order history:", err)
          );
      })
      .catch((err) => {
        console.error("Multi-vendor checkout failed:", err);
        alert("Something went wrong during checkout.");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cartItems");
    navigate("/login");
  };

  const toggleCart = () => {
    setCartVisible(!cartVisible);
  };

  return (
    <>
    <div className="dashboard-background"></div>
    <div className="background-overlay"></div>
    <div className="app-overlay">
    {sidebarOpen && (
    <div
      className="sidebar-overlay"
      onClick={() => setSidebarOpen(false)}
    />
  )}
    <Sidebar
  isOpen={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  setView={setView}
  handleLogout={handleLogout}
  />
    <div className="student-dashboard">
      {showToast && suggestedVendor && (
        <div className="suggested-toast">
          <div className="toast-text">
            <div className="suggested-label">Suggested for you</div>
            <div className="vendor-row">
              <img
                src={getVendorLogo(suggestedVendor.vendorName)}
                alt={suggestedVendor.vendorName}
                className="toast-logo"
              />
              <div className="vendor-info">
                <strong>{suggestedVendor.vendorName}</strong>
                <span className="days-ago">Ordered 5+ days ago</span>
              </div>
            </div>
          </div>
          <button
            className="reorder-toast-btn"
            onClick={() => {
              const restored = suggestedVendor.items.map((item) => ({
              ...item,
              vendorName: suggestedVendor.vendorName,
              vendorId: suggestedVendor.vendorId,
            }));
            setSelectedItems(restored);
            setCartVisible(true);
            setShowToast(false);
          }}
        >
          Reorder →
        </button>
              
        <button
          className="toast-close-btn"
          onClick={() => setShowToast(false)}
        >
         ✕
       </button>
     </div>
  )}
 
      <div className="dashboard-header">
       <div className="header-left">
            <button
              className="hamburger-icon"
              onClick={() => setSidebarOpen(true)}
              style={{ marginRight: "16px",
                fontSize: "20px",
                background: "none",
                border: "none",
                color: "#f1c40f",
                cursor: "pointer",
                zIndex: 9999}}
            >
              ☰
            </button>
        <div className="header-title">
          Campus Food – Welcome, {studentName} 👋
        </div>
        </div>
        <div className="header-buttons">
          <button
            onClick={() => setView("notifications")}
            className="notification-icon-button"
          >
            <span role="img" aria-label="Notifications">🔔</span>
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length}</span>
            )}
          </button>

          <button onClick={toggleCart}>
            Cart 🛒 {selectedItems.reduce((sum, i) => sum + i.quantity, 0)}
          </button>
        </div>
      </div>
      {view === "restaurants" && (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="popular-restaurants">
            {vendors
              .filter((vendor) =>
                vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((vendor) => (
                <div
                  key={vendor._id}
                  className="restaurant-card"
                  onClick={(e) => toggleMenu(e, vendor._id)}
                >
                  <div className="restaurant-content">
                    <img
                      className="restaurant-image"
                      src={getVendorLogo(vendor.name)}
                      alt={vendor.name}
                    />
                    <div>
                    <h5 className="restaurant-name">
                      {vendor.name}
                      <span className="rating-badge">⭐ {vendor.averageRating || "0.0"}</span>
                      </h5>
                      <div className="text-muted">{vendor.address}</div>
                    </div>
                  </div>
                  {expandedRestaurantId === vendor._id && (
                    <div className="menu-items mt-3">
                      {vendor.menu.map((item) => {
                        const existing = selectedItems.find(
                          (i) =>
                            i.name === item.name &&
                            i.vendorName === vendor.name
                        );
                        return (
                          <div key={item.name} className="menu-item">
                            <div className="item-info">
                              <div className="item-name">
                                {item.name}
                                {item.todaysSpecial && (
                                  <span className="special-badge"> ⭐ Special</span>
                                )}
                             </div>
                              <div className="item-price">${item.price}</div>
                            </div>
                            {item.outOfStock ? (
                              <button disabled style={{
                                backgroundColor: '#ccc',
                                color: '#666',
                                cursor: 'not-allowed',
                                width: 'auto',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: 'none'
                              }}>
                                Out of Stock
                              </button>
                            ) : existing ? (
                              <div className="cart-controls">
                                <button onClick={(e) => removeItem(e, { ...item, vendorName: vendor.name })}>
                                  −
                                </button>
                                <span>{existing.quantity}</span>
                                <button onClick={(e) => addItem(e, item, vendor.name)}>
                                  +
                                </button>
                                </div>
                            ) : (
                                <button onClick={(e) => addItem(e, item, vendor.name)}>+</button>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}

      {view === "orders" && (
        <MyOrders
          orders={orderHistory}
          setCartVisible={setCartVisible}
          updateSelectedItems={setSelectedItems} 
       />
     )}

      {view === "favoriteOrders" && (
        <div className="favorite-orders-section">
          <h3>❤️ Favorite Orders</h3>
          {favoriteOrders.length === 0 ? (
            <p>No favorite orders saved yet.</p>
          ) : (
            <ul className="favorite-orders-list">
              {favoriteOrders.map((fav, idx) => (
                <li key={idx} className="favorite-order-card">
                  <h4>{fav.vendorName}</h4>
                  <ul>
                    {fav.items.map((item, i) => (
                      <li key={i}>
                        {item.name} x {item.quantity} – ${item.price}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      const restored = fav.items.map((item) => ({
                        ...item,
                        vendorName: fav.vendorName,
                        vendorId: fav.vendorId,
                      }));
                      setSelectedItems(restored);
                      setCartVisible(true);
                    }}
                  >
                    🔁 Reorder
                  </button>
                  <button
                    style={{
                      marginTop: "5px",
                      backgroundColor: "#ff4d4d",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    onClick={async () => {
                      const confirmed = window.confirm("Are you sure you want to delete this favorite order?");
                      if (!confirmed) return;

                      try {
                        await axios.delete(`https://order-service-vgej.onrender.com/favorite-order/${fav._id}`);
                        setFavoriteOrders(prev => prev.filter(f => f._id !== fav._id));
                        window.alert("🗑️ Favorite order deleted!");
                      } catch (error) {
                        console.error("Error deleting favorite order:", error);
                        window.alert("❌ Failed to delete favorite order. Please try again.");
                      }
                    }}
                  >
                    🗑️ Delete
                  </button>

                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === "notifications" && (
        <div className="notifications-section">
          <h3>🔔 Notifications</h3>
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <img src="/images/yellow-bell.png" alt="No Notifications" />
              <h2>No New Notifications</h2>
              <p>You're all caught up!</p>
              <button 
                className="refresh-btn"
                onClick={() => setNotifications([])}
              >
               Refresh
              </button>

            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {notifications.map((note, index) => (
                <li key={index} className="notification-item">
                  {note}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === "settings" && (
        <>
          {settingsView === "main" && (
            <SettingsMainView
            onNavigate={setSettingsView}
            currentName={name}
            currentEmail={email}
            dob={dob}
            phoneNumber={phoneNumber}
          />          
          )}

       {settingsView === "edit-name" && (
         <EditNameView
           onBack={() => setSettingsView("main")}
           currentName={name}
           onUpdateName={handleUpdateName}
        />
      )}
      {settingsView === "edit-dob" && (
        <EditDobView
          onBack={() => setSettingsView("main")}
          currentDob={dob}
          onUpdateDob={handleUpdateDob}
        />
      )}

       {settingsView === "edit-phone" && (
         <EditPhoneView
           onBack={() => setSettingsView("main")}
           currentPhone={phoneNumber}
          onUpdatePhone={handleUpdatePhone}
         />
       )}

       {settingsView === "edit-email" && (
        <EditEmailView
          onBack={() => setSettingsView("main")}
          currentEmail={email}
          onUpdateEmail={handleUpdateEmail}
        />
       )}
       {settingsView === "edit-password" && (
         <EditPasswordView
          onBack={() => setSettingsView("main")}
          onChangePassword={handlePasswordChange}
         />
       )}

        </>
      )}



      <div className={`cart-view ${cartVisible ? "show" : ""}`}>
        <div className="cart-header">
          <button className="close-button" onClick={() => setCartVisible(false)}>
            ✕
          </button>
          <div className="cart-title">Your Cart</div>
        </div>

        <div className="cart-items">
          {selectedItems.length === 0 ? (
            <div className="empty-cart-modern">
              <img
                src="/images/empty-cart.png"
                alt="Empty Cart"
                className="empty-cart-icon"
              />
              <h3>Add items to start a cart</h3>
              <p>Once you add items from a restaurant or store, your cart will appear here.</p>
              <button
                className="start-shopping-btn"
                onClick={() => {
                  setCartVisible(false);
                  setView("restaurants");
                }}
              >
                Start shopping
              </button>
            </div>
          ) : (
            Object.entries(
              selectedItems.reduce((grouped, item) => {
                if (!grouped[item.vendorName]) {
                  grouped[item.vendorName] = {
                    vendorId: item.vendorId,
                    items: [],
                  };
                }
                grouped[item.vendorName].items.push(item);
                return grouped;
              }, {})
            ).map(([vendorName, { vendorId, items }]) => (
              <div key={vendorName} className="vendor-cart-group">
                <div className="cart-restaurant-info">
                  <img
                    src={getVendorLogo(vendorName)}
                    alt={vendorName}
                    className="cart-restaurant-logo"
                  />
                  <span className="cart-restaurant-name">{vendorName}</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="cart-item">
                    <div className="item-details">
                      <div className="item-name">{item.name}</div>
                      <div className="item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="quantity-control">
                      <button className="quantity-btn" onClick={(e) => removeItem(e, item)}>
                        −
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button className="quantity-btn" onClick={(e) => addItem(e, item, vendorName)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <hr />
              </div>
            ))
          )}
        </div>

        {selectedItems.length > 0 && (
          <>
            <div className="cart-actions">
              <button
                className="action-btn secondary"
                onClick={() => {
                  setView("restaurants");
                  setCartVisible(false);
                }}
              >
                + Add More Items
              </button>
              <button className="action-btn primary" onClick={() => setShowPaymentModal(true)}>
                Go to Checkout
              </button>
            </div>
            <div className="cart-total">
              Subtotal: <strong>${subtotal.toFixed(2)}</strong>
            </div>
          </>
        )}
      </div>

      {selectedItems.length > 0 && !cartVisible && (
        <div className="view-cart-footer">
          <button onClick={toggleCart}>
            View Cart • {selectedItems.reduce((sum, i) => sum + i.quantity, 0)} • ${subtotal.toFixed(2)}
          </button>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
         <div className="modal-box">
           <h4>Pay with Card</h4>
           <Checkout
             amount={subtotal}
             onSuccess={(paymentIntent) => {
               setShowPaymentModal(false);
               placeOrder();
             }}
           />
         </div>
       </div>
       )}


      {showReceiptModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h4>✅ Payment Successful</h4>
            <p><strong>Order ID:</strong> {lastPayment?.order_id}</p>
            <p>
              <strong>Amount:</strong> $
              {!isNaN(lastPayment?.amount)
                ? Number(lastPayment.amount).toFixed(2)
                : "0.00"}
            </p>
            <p><strong>Status:</strong> {lastPayment?.status}</p>
            <button 
              className="save-favorite-btn" 
              onClick={saveFavoriteOrder}
              style={{ marginBottom: "10px", backgroundColor: "gold", padding: "8px", borderRadius: "8px", border: "none", fontWeight: "600" }}
            >
             ❤️ Save This Order as Favorite
           </button>
            <button onClick={() => setShowReceiptModal(false)}>Close</button>
          </div>
        </div>
      )}           
    </div>
    </div>
    </>
  );
};

export default StudentHome;
