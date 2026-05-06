const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { recommendFood, freshnessScore, kitchenLoad, deliveryCost } = require("../controllers/aiController");

router.get("/recommendations", protect, recommendFood);
router.post("/freshness-score", freshnessScore);
router.post("/kitchen-load", kitchenLoad);
router.post("/delivery-cost", deliveryCost);

module.exports = router;
