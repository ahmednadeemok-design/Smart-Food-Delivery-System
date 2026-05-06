import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ManageUsers from "./pages/ManageUsers.jsx";
import ManageRiders from "./pages/ManageRiders.jsx";
import ManageRestaurants from "./pages/ManageRestaurants.jsx";
import Orders from "./pages/Orders.jsx";
import Complaints from "./pages/Complaints.jsx";
import Refunds from "./pages/Refunds.jsx";
import TrustScores from "./pages/TrustScores.jsx";
import Analytics from "./pages/Analytics.jsx";
import SystemHealth from "./pages/SystemHealth.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<ManageUsers />} />
          <Route path="/riders" element={<ManageRiders />} />
          <Route path="/restaurants" element={<ManageRestaurants />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/trust-scores" element={<TrustScores />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/system-health" element={<SystemHealth />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
