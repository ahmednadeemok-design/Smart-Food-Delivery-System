const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { createOrder, getMyOrders, updateOrderStatus, verifyDelivery } = require("../controllers/orderController");

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.patch("/:id/status", protect, roleMiddleware("rider", "restaurant", "admin"), updateOrderStatus);
router.post("/:id/verify-delivery", protect, verifyDelivery);

module.exports = router;
