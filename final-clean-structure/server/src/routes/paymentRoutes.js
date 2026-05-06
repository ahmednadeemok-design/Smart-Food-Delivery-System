const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { createPayment, getPayments } = require("../controllers/paymentController");

router.post("/", protect, createPayment);
router.get("/", protect, roleMiddleware("admin"), getPayments);

module.exports = router;
