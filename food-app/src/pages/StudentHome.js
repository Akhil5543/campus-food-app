import React, { useEffect, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");

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
        .get(`https://order-service-[your-subdomain].onrender.com/orders/user/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setOrderHistory(res.data.orders))
        .catch((err) => console.error("Error fetching order history:", err));
    }
  }, [studentId, token]);

  const placeOrder = () => {
    const grouped = selectedItems.reduce((acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          restaurantId: item.vendorId,
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
        .post("https://order-service-[your-subdomain].onrender.com/orders", orderData, {
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
          return axios.post("https://payment-service-fgt8.onrender.com/payments", paymentPayload);
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
        setCartVisible(false);
        setShowPaymentModal(false);
        setLastPayment({ order_id: allOrderIds, amount: totalPaid, status: "paid" });
        setShowReceiptModal(true);
        setView("restaurants");

        axios
          .get(`https://order-service-[your-subdomain].onrender.com/orders/user/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => setOrderHistory(res.data.orders))
          .catch((err) => console.error("Error refreshing order history:", err));
      })
      .catch((err) => {
        console.error("Multi-vendor checkout failed:", err);
        alert("Something went wrong during checkout.");
      });
  };

  // Rest of your component logic (toggleMenu, addItem, removeItem, etc.) remains unchanged...

  return (
    // your full JSX here (same as in the file you shared)
  );
};

export default StudentHome;
