import { Navigate, Route, Routes } from "react-router-dom";
import RiderLayout from "./components/layout/RiderLayout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RiderDashboard from "./pages/RiderDashboard.jsx";
import AvailableOrders from "./pages/AvailableOrders.jsx";
import ActiveDelivery from "./pages/ActiveDelivery.jsx";
import MultiOrderRoute from "./pages/MultiOrderRoute.jsx";
import DeliveryVerification from "./pages/DeliveryVerification.jsx";
import RiderHistory from "./pages/RiderHistory.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<RiderLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<RiderDashboard />} />
          <Route path="/available-orders" element={<AvailableOrders />} />
          <Route path="/active-delivery" element={<ActiveDelivery />} />
          <Route path="/multi-order-route" element={<MultiOrderRoute />} />
          <Route path="/delivery-verification" element={<DeliveryVerification />} />
          <Route path="/history" element={<RiderHistory />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
