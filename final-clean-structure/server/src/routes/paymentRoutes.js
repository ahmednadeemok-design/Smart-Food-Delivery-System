const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { createPayment, getPayments, requestRefund } = require("../controllers/paymentController");

router.post("/", protect, createPayment);
router.post("/orders/:orderId/refund-request", protect, roleMiddleware("customer"), requestRefund);
router.get("/", protect, roleMiddleware("admin"), getPayments);

module.exports = router;
