import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import MyOrders from "../components/MyOrders";
import "./StudentHome.css";

const StudentHome = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedRestaurantId, setExpandedRestaurantId] = useState(null);
  const [view, setView] = useState("restaurants");
  const [orderHistory, setOrderHistory] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Campus Card");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastPayment, setLastPayment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [favoritesDrawerVisible, setFavoritesDrawerVisible] = useState(false);

  const token = localStorage.getItem("token") || "";
  let studentName = "Student";
  let studentId = "";

  if (token) {
    try {
      const decoded = jwtDecode(token);
      studentName = decoded.name || "Student";
      studentId = decoded.userId || decoded.id || decoded.sub || "";
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  const getVendorLogo = (name) => {
    const formatted = name.toLowerCase().replace(/\s+/g, "-");
    return `${process.env.PUBLIC_URL}/images/${formatted}.png`;
  };

  // FAVORITES: Load favorites from local storage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteRestaurants");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // FAVORITES: Save favorites to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("favoriteRestaurants", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) setSelectedItems(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(selectedItems));
  }, [selectedItems]);

  useEffect(() => {
    axios
      .get("https://vendor-service-wnkw.onrender.com/vendors")
      .then((res) => setVendors(res.data))
      .catch((err) => console.error("Error fetching vendors:", err));

    if (studentId) {
      axios
        .get(`https://order-service-vgej.onrender.com/orders/user/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setOrderHistory(res.data.orders))
        .catch((err) => console.error("Error fetching order history:", err));
    }
  }, [studentId, token]);
 
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

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // FAVORITES: Toggle favorite for a restaurant (vendor)
  const toggleFavorite = (restaurant) => {
    const isFavorite = favorites.some((fav) => fav._id === restaurant._id);
    if (isFavorite) {
      setFavorites(favorites.filter((fav) => fav._id !== restaurant._id));
    } else {
      setFavorites([...favorites, restaurant]);
    }
  };

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
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          Campus Food – Welcome, {studentName} 👋
        </div>
        <div className="header-buttons">
          <button onClick={() => setView("restaurants")}>Restaurants</button>
          <button onClick={() => setView("orders")}>My Orders</button>
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
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Restaurants view */}
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
                        <span className="rating-badge">4.7</span>
                      </h5>
                      <div className="text-muted">{vendor.address}</div>
                    </div>
                    {/* FAVORITES: Favorite icon on restaurant cards */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(vendor);
                      }}
                      style={{ cursor: "pointer", fontSize: "24px", marginLeft: "auto" }}
                    >
                      {favorites.some((fav) => fav._id === vendor._id) ? "💖" : "🤍"}
                    </span>
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

      {view === "orders" && <MyOrders orders={orderHistory} />}
      {view === "notifications" && (
        <div className="notifications-section">
          <h3>🔔 Notifications</h3>
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <img src="/images/bell-icon.png" alt="No Notifications" />
              <h2>No New Notifications</h2>
              <p>You're all caught up!</p>
              <button className="refresh-btn" onClick={() => window.location.reload()}>
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
            <h4>Select Payment Method</h4>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option>Campus Card</option>
              <option>Credit Card</option>
              <option>Cash</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button onClick={placeOrder}>Confirm & Pay</button>
            </div>
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
            <button onClick={() => setShowReceiptModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Floating Favorites Button */}
      <div 
        className="floating-favorites-button"
        onClick={() => setFavoritesDrawerVisible(true)}
      >
        <span role="img" aria-label="Favorites">💖</span>
      </div>
      {/* Favorites Drawer */}
      {favoritesDrawerVisible && (
        <div className="favorites-drawer">
          <div className="drawer-header">
            <h3>My Favorites</h3>
            <button onClick={() => setFavoritesDrawerVisible(false)}>×</button>
          </div>
          <div className="drawer-content">
            {favorites.length === 0 ? (
              <p>No favorites yet.</p>
            ) : (
              favorites.map((fav) => (
                <div key={fav._id} className="drawer-item">
                  <img 
                    src={getVendorLogo(fav.name)} 
                    alt={fav.name} 
                    className="drawer-image" 
                  />
                  <div className="drawer-info">
                    <h4>{fav.name}</h4>
                    <p>{fav.address}</p>
                    <button onClick={() => navigate(`/restaurant/${fav._id}`)}>
                      Reorder
                    </button>
                  </div>
                  <span
                    className="drawer-remove"
                    onClick={() => toggleFavorite(fav)}
                  >
                    Remove
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
};

export default StudentHome;
