const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { createRiderProfile, updateLocation, updateAvailability, getRiders, getMyRiderProfile } = require("../controllers/riderController");
const { getAvailableOrders, acceptOrder, updateOrderStatus, verifyDelivery } = require("../controllers/orderController");

router.get("/me", protect, roleMiddleware("rider"), getMyRiderProfile);
router.post("/profile", protect, roleMiddleware("rider"), createRiderProfile);
router.patch("/availability", protect, roleMiddleware("rider"), updateAvailability);
router.patch("/location", protect, roleMiddleware("rider"), updateLocation);
router.get("/available-orders", protect, roleMiddleware("rider"), getAvailableOrders);
router.post("/orders/:orderId/accept", protect, roleMiddleware("rider"), acceptOrder);
router.patch("/orders/:orderId/status", protect, roleMiddleware("rider"), updateOrderStatus);
router.post("/orders/:orderId/verify-otp", protect, roleMiddleware("rider"), verifyDelivery);
router.get("/", protect, roleMiddleware("admin"), getRiders);

module.exports = router;
