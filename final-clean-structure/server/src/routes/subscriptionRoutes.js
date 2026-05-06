const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { createSubscription, getMySubscription } = require("../controllers/subscriptionController");

router.post("/", protect, createSubscription);
router.get("/my", protect, getMySubscription);

module.exports = router;
