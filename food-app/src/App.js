import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentHome from "./pages/StudentHome";
import RestaurantDashboard from "./pages/RestaurantDashboard"; // create later
import PrivateRoute from "./components/PrivateRoute"; // we'll make this too

function App() {
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
