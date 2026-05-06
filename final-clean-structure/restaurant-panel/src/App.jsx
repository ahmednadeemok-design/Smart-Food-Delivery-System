import { Navigate, Route, Routes } from "react-router-dom";
import RestaurantLayout from "./components/layout/RestaurantLayout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RestaurantDashboard from "./pages/RestaurantDashboard.jsx";
import Orders from "./pages/Orders.jsx";
import MenuManagement from "./pages/MenuManagement.jsx";
import KitchenLoad from "./pages/KitchenLoad.jsx";
import AccuracyReports from "./pages/AccuracyReports.jsx";
import QualityAudit from "./pages/QualityAudit.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<RestaurantLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<RestaurantDashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/kitchen-load" element={<KitchenLoad />} />
          <Route path="/accuracy-reports" element={<AccuracyReports />} />
          <Route path="/quality-audit" element={<QualityAudit />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
