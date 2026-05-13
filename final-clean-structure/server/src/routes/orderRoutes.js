const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createOrder,
  getMyOrders,
  getAvailableOrders,
  acceptOrder,
  updateOrderStatus,
  verifyDelivery,
  cancelMyOrder,
  getOrderById,
  hideMyOrder,
} = require("../controllers/orderController");

router.post("/", protect, roleMiddleware("customer"), createOrder);
router.get("/my", protect, getMyOrders);
router.get("/available", protect, roleMiddleware("rider", "admin"), getAvailableOrders);
router.get("/:id", protect, getOrderById);
router.post("/:id/cancel", protect, roleMiddleware("customer"), cancelMyOrder);
router.patch("/:id/hide", protect, roleMiddleware("customer"), hideMyOrder);
router.post("/:id/accept", protect, roleMiddleware("rider"), acceptOrder);
router.patch("/:id/status", protect, roleMiddleware("rider", "restaurant", "admin"), updateOrderStatus);
router.patch("/:id/restaurant-status", protect, roleMiddleware("restaurant", "admin"), updateOrderStatus);
router.post("/:id/verify-delivery", protect, verifyDelivery);

module.exports = router;
