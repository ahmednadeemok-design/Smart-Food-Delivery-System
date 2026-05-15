import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import { ContactModalHost } from "./components/common/ContactActions.jsx";
import { ActionMenuHost } from "./components/common/PortalActionMenu.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RestaurantList from "./pages/RestaurantList.jsx";
import RestaurantDetails from "./pages/RestaurantDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderConfirmation from "./pages/OrderConfirmation.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import Complaint from "./pages/Complaint.jsx";
import Subscription from "./pages/Subscription.jsx";
import HealthDashboard from "./pages/HealthDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/restaurants" element={<RestaurantList />} />
          <Route path="/restaurants/:id" element={<RestaurantDetails />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/orders" element={<OrderTracking />} />
            <Route path="/complaint" element={<Complaint />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/health" element={<HealthDashboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <ContactModalHost />
      <ActionMenuHost />
    </>
  );
}
