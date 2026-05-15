const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createRiderProfile,
  updateRiderProfile,
  updateLocation,
  updateAvailability,
  getRiders,
  getMyRiderProfile,
  getActiveOrder,
  getRiderHistory,
  getRiderEarnings,
  getMyRiderFinance,
  createMyRiderPayoutRequest,
} = require("../controllers/riderController");
const { getAvailableOrders, acceptOrder, updateOrderStatus, verifyDelivery, rejectOrder, markPicked } = require("../controllers/orderController");

router.get("/me", protect, roleMiddleware("rider"), getMyRiderProfile);
router.post("/profile", protect, roleMiddleware("rider"), createRiderProfile);
router.patch("/profile", protect, roleMiddleware("rider"), updateRiderProfile);
router.patch("/availability", protect, roleMiddleware("rider"), updateAvailability);
router.patch("/location", protect, roleMiddleware("rider"), updateLocation);
router.get("/available-orders", protect, roleMiddleware("rider"), getAvailableOrders);
router.post("/orders/:orderId/accept", protect, roleMiddleware("rider"), acceptOrder);
router.post("/orders/:orderId/reject", protect, roleMiddleware("rider"), rejectOrder);
router.patch("/orders/:orderId/picked", protect, roleMiddleware("rider"), markPicked);
router.patch("/orders/:orderId/status", protect, roleMiddleware("rider"), updateOrderStatus);
router.post("/orders/:orderId/verify-otp", protect, roleMiddleware("rider"), verifyDelivery);
router.get("/active-order", protect, roleMiddleware("rider"), getActiveOrder);
router.get("/history", protect, roleMiddleware("rider"), getRiderHistory);
router.get("/earnings", protect, roleMiddleware("rider"), getRiderEarnings);
router.get("/finance", protect, roleMiddleware("rider"), getMyRiderFinance);
router.post("/payout-requests", protect, roleMiddleware("rider"), createMyRiderPayoutRequest);
router.get("/", protect, roleMiddleware("admin"), getRiders);

module.exports = router;
